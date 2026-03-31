package com.tuinventario.api.loan;

import com.tuinventario.api.domain.entity.BorrowerEntity;
import com.tuinventario.api.domain.entity.ItemEntity;
import com.tuinventario.api.domain.entity.LoanEntity;
import com.tuinventario.api.domain.entity.LoanItemEntity;
import com.tuinventario.api.domain.entity.LoanRequestEntity;
import com.tuinventario.api.domain.enums.ItemStatus;
import com.tuinventario.api.domain.enums.LoanRequestStatus;
import com.tuinventario.api.domain.enums.LoanStatus;
import com.tuinventario.api.domain.enums.ReturnCondition;
import com.tuinventario.api.domain.repository.BorrowerRepository;
import com.tuinventario.api.domain.repository.ItemRepository;
import com.tuinventario.api.domain.repository.LoanItemRepository;
import com.tuinventario.api.domain.repository.LoanRepository;
import com.tuinventario.api.domain.repository.LoanRequestRepository;
import com.tuinventario.api.shared.exception.ApiException;
import com.tuinventario.api.shared.service.AuditService;
import com.tuinventario.api.shared.service.CurrentContextService;
import com.tuinventario.api.shared.service.RealtimePublisher;
import com.tuinventario.api.shared.util.QuantityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final CurrentContextService currentContextService;
    private final BorrowerRepository borrowerRepository;
    private final ItemRepository itemRepository;
    private final LoanRequestRepository loanRequestRepository;
    private final LoanRepository loanRepository;
    private final LoanItemRepository loanItemRepository;
    private final AuditService auditService;
    private final RealtimePublisher realtimePublisher;

    @Transactional(readOnly = true)
    public List<LoanDtos.LoanRequestResponse> listLoanRequests(UUID locationId) {
        UUID effectiveLocationId = currentContextService.effectiveLocationId(locationId);
        return loanRequestRepository.findByOrganizationIdOrderByRequestedAtDesc(currentContextService.currentUser().organizationId())
                .stream()
                .filter(loanRequest -> effectiveLocationId == null || loanRequest.getItem().getPrimaryLocation().getId().equals(effectiveLocationId))
                .map(this::mapLoanRequest)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LoanDtos.LoanResponse> listLoans(UUID locationId) {
        UUID effectiveLocationId = currentContextService.effectiveLocationId(locationId);
        return loanRepository.findByOrganizationIdOrderByCreatedAtDesc(currentContextService.currentUser().organizationId())
                .stream()
                .filter(loan -> {
                    LoanItemEntity loanItem = loanItemRepository.findByLoanId(loan.getId()).stream().findFirst().orElse(null);
                    return effectiveLocationId == null || loanItem != null && loanItem.getItem().getPrimaryLocation().getId().equals(effectiveLocationId);
                })
                .map(this::mapLoan)
                .toList();
    }

    @Transactional
    public LoanDtos.LoanResponse updateLoan(UUID loanId, LoanDtos.UpdateLoanPayload request) {
        currentContextService.requireManagerOrAdmin();
        LoanEntity loan = findLoan(loanId);
        LoanItemEntity loanItem = findLoanItem(loan);

        Instant requestedAt = loan.getLoanRequest() == null ? loan.getCreatedAt() : loan.getLoanRequest().getRequestedAt();
        validateEditableDates(loan, request, requestedAt);

        loan.setDueAt(request.dueAt());
        if (loan.getLoanRequest() != null) {
            loan.getLoanRequest().setDueAt(request.dueAt());
            loanRequestRepository.save(loan.getLoanRequest());
        }

        if (loan.getStatus() != LoanStatus.APPROVED) {
            loan.setLoanedAt(request.loanedAt());
        }
        if (loan.getStatus() == LoanStatus.RETURNED) {
            loan.setReturnedAt(request.returnedAt());
            loanItem.setReturnNotes(normalizeOptional(request.returnNotes()));
            loanItemRepository.save(loanItem);
        }

        loan.setNotes(normalizeOptional(request.notes()));
        loanRepository.save(loan);

        Map<String, Object> auditPayload = new LinkedHashMap<>();
        auditPayload.put("dueAt", request.dueAt());
        auditPayload.put("loanedAt", request.loanedAt());
        auditPayload.put("returnedAt", request.returnedAt());

        auditService.log(
                currentContextService.currentOrganizationEntity(),
                currentContextService.currentActorEntity(),
                "LOAN",
                loan.getId(),
                "LOAN_UPDATED",
                auditPayload
        );
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "loan.updated", Map.of("loanId", loan.getId().toString()));
        return mapLoan(loan);
    }

    @Transactional
    public LoanDtos.LoanRequestResponse createLoanRequest(LoanDtos.LoanRequestPayload request) {
        QuantityUtils.requirePositive(request.quantity());
        BorrowerEntity borrower = borrowerRepository.findByIdAndOrganizationIdAndDeletedAtIsNull(UUID.fromString(request.borrowerId()), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BORROWER_NOT_FOUND", "Prestatario no encontrado."));
        ItemEntity item = findLendableItem(request.itemId());
        ensureRequestable(item, request.quantity());

        LoanRequestEntity entity = new LoanRequestEntity();
        entity.setOrganization(currentContextService.currentOrganizationEntity());
        entity.setBorrower(borrower);
        entity.setItem(item);
        entity.setQuantity(request.quantity());
        entity.setRequestedBy(currentContextService.currentActorEntity());
        entity.setStatus(LoanRequestStatus.PENDING);
        entity.setRequestedAt(Instant.now());
        entity.setDueAt(request.dueAt());
        entity.setNotes(request.notes());
        loanRequestRepository.save(entity);

        auditService.log(currentContextService.currentOrganizationEntity(), currentContextService.currentActorEntity(), "LOAN_REQUEST", entity.getId(), "LOAN_REQUEST_CREATED", Map.of("itemId", item.getId(), "quantity", request.quantity()));
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "loan.requested", Map.of("loanRequestId", entity.getId().toString()));
        return mapLoanRequest(entity);
    }

    @Transactional
    public LoanDtos.LoanRequestResponse createPublicLoanRequest(LoanDtos.PublicLoanRequestPayload request) {
        QuantityUtils.requirePositive(request.quantity());
        ItemEntity item = itemRepository.findById(UUID.fromString(request.itemId()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND", "Item no encontrado."));
        if (!item.isLendable()) {
            throw new ApiException(HttpStatus.CONFLICT, "ITEM_NOT_LENDABLE", "El item no admite prestamos.");
        }
        if (item.getStatus() == ItemStatus.ARCHIVED || item.getStatus() == ItemStatus.LOST || item.getStatus() == ItemStatus.MAINTENANCE) {
            throw new ApiException(HttpStatus.CONFLICT, "ITEM_UNAVAILABLE_FOR_LOAN", "El item no se encuentra disponible para prestamos.");
        }
        ensureRequestable(item, request.quantity());

        BorrowerEntity borrower = borrowerRepository.findByOrganizationIdAndDeletedAtIsNullOrderByNameAsc(item.getOrganization().getId()).stream()
                .filter(existing -> existing.getName().equalsIgnoreCase(request.borrowerName()))
                .findFirst()
                .orElseGet(() -> {
                    BorrowerEntity entity = new BorrowerEntity();
                    entity.setOrganization(item.getOrganization());
                    entity.setName(request.borrowerName());
                    entity.setEmail(request.borrowerEmail());
                    entity.setPhone(request.borrowerPhone());
                    entity.setNotes("Creado desde solicitud publica");
                    return borrowerRepository.save(entity);
                });

        LoanRequestEntity entity = new LoanRequestEntity();
        entity.setOrganization(item.getOrganization());
        entity.setBorrower(borrower);
        entity.setItem(item);
        entity.setQuantity(request.quantity());
        entity.setStatus(LoanRequestStatus.PENDING);
        entity.setRequestedAt(Instant.now());
        entity.setDueAt(request.dueAt());
        entity.setNotes(request.notes());
        loanRequestRepository.save(entity);
        return mapLoanRequest(entity);
    }

    @Transactional
    public LoanDtos.LoanResponse approveLoanRequest(UUID loanRequestId, LoanDtos.LoanActionPayload request) {
        currentContextService.requireManagerOrAdmin();
        LoanRequestEntity loanRequest = findLoanRequest(loanRequestId);
        if (loanRequest.getStatus() != LoanRequestStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_LOAN_REQUEST_STATE", "La solicitud ya no se encuentra pendiente.");
        }

        ItemEntity item = loanRequest.getItem();
        ensureAvailable(item, loanRequest.getQuantity());
        item.setAvailableStock(item.getAvailableStock().subtract(loanRequest.getQuantity()));
        item.setReservedStock(item.getReservedStock().add(loanRequest.getQuantity()));
        item.setStatus(ItemStatus.RESERVED);
        item.setLastMovementAt(Instant.now());
        ensureStockIntegrity(item);
        itemRepository.save(item);

        loanRequest.setStatus(LoanRequestStatus.APPROVED);
        loanRequest.setNotes(request.notes() == null ? loanRequest.getNotes() : request.notes());
        loanRequestRepository.save(loanRequest);

        LoanEntity loan = new LoanEntity();
        loan.setOrganization(loanRequest.getOrganization());
        loan.setBorrower(loanRequest.getBorrower());
        loan.setLoanRequest(loanRequest);
        loan.setStatus(LoanStatus.APPROVED);
        loan.setApprovedBy(currentContextService.currentActorEntity());
        loan.setDueAt(loanRequest.getDueAt());
        loan.setNotes(loanRequest.getNotes());
        loanRepository.save(loan);

        LoanItemEntity loanItem = new LoanItemEntity();
        loanItem.setLoan(loan);
        loanItem.setItem(item);
        loanItem.setQuantity(loanRequest.getQuantity());
        loanItem.setReturnedQuantity(BigDecimal.ZERO);
        loanItem.setReturnedGoodQuantity(BigDecimal.ZERO);
        loanItem.setLostQuantity(BigDecimal.ZERO);
        loanItemRepository.save(loanItem);

        auditService.log(currentContextService.currentOrganizationEntity(), currentContextService.currentActorEntity(), "LOAN", loan.getId(), "LOAN_APPROVED", Map.of("loanRequestId", loanRequestId));
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "loan.approved", Map.of("loanId", loan.getId().toString()));
        return mapLoan(loan);
    }

    @Transactional
    public LoanDtos.LoanResponse rejectLoanRequest(UUID loanRequestId, LoanDtos.LoanActionPayload request) {
        currentContextService.requireManagerOrAdmin();
        LoanRequestEntity loanRequest = findLoanRequest(loanRequestId);
        if (loanRequest.getStatus() != LoanRequestStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_LOAN_REQUEST_STATE", "La solicitud ya no se encuentra pendiente.");
        }

        String rejectionReason = normalizeOptional(request.notes());
        if (rejectionReason == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "REJECTION_REASON_REQUIRED", "Debes indicar el motivo del rechazo.");
        }

        loanRequest.setStatus(LoanRequestStatus.REJECTED);
        loanRequest.setNotes(mergeNotes(loanRequest.getNotes(), "Motivo de rechazo: " + rejectionReason));
        loanRequestRepository.save(loanRequest);

        LoanEntity loan = new LoanEntity();
        loan.setOrganization(loanRequest.getOrganization());
        loan.setBorrower(loanRequest.getBorrower());
        loan.setLoanRequest(loanRequest);
        loan.setStatus(LoanStatus.REJECTED);
        loan.setDueAt(loanRequest.getDueAt());
        loan.setNotes(loanRequest.getNotes());
        loanRepository.save(loan);

        LoanItemEntity loanItem = new LoanItemEntity();
        loanItem.setLoan(loan);
        loanItem.setItem(loanRequest.getItem());
        loanItem.setQuantity(loanRequest.getQuantity());
        loanItem.setReturnedQuantity(BigDecimal.ZERO);
        loanItem.setReturnedGoodQuantity(BigDecimal.ZERO);
        loanItem.setLostQuantity(BigDecimal.ZERO);
        loanItemRepository.save(loanItem);

        auditService.log(
                currentContextService.currentOrganizationEntity(),
                currentContextService.currentActorEntity(),
                "LOAN",
                loan.getId(),
                "LOAN_REJECTED",
                Map.of("loanRequestId", loanRequestId, "reason", rejectionReason)
        );
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "loan.rejected", Map.of("loanId", loan.getId().toString()));
        return mapLoan(loan);
    }

    @Transactional
    public LoanDtos.LoanResponse deliverLoan(UUID loanId, LoanDtos.LoanActionPayload request) {
        currentContextService.requireManagerOrAdmin();
        LoanEntity loan = findLoan(loanId);
        if (loan.getStatus() != LoanStatus.APPROVED) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_LOAN_STATE", "Solo se pueden entregar prestamos aprobados.");
        }

        LoanItemEntity loanItem = loanItemRepository.findByLoanId(loan.getId()).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "LOAN_ITEM_MISSING", "El prestamo no tiene items."));
        ItemEntity item = loanItem.getItem();
        item.setReservedStock(item.getReservedStock().subtract(loanItem.getQuantity()));
        item.setLoanedStock(item.getLoanedStock().add(loanItem.getQuantity()));
        item.setStatus(ItemStatus.ON_LOAN);
        item.setLastMovementAt(Instant.now());
        ensureStockIntegrity(item);
        itemRepository.save(item);

        loan.setStatus(LoanStatus.DELIVERED);
        loan.setDeliveredBy(currentContextService.currentActorEntity());
        loan.setLoanedAt(Instant.now());
        loan.setNotes(mergeNotes(loan.getNotes(), request.notes()));
        loanRepository.save(loan);

        auditService.log(currentContextService.currentOrganizationEntity(), currentContextService.currentActorEntity(), "LOAN", loan.getId(), "LOAN_DELIVERED", Map.of("itemId", item.getId()));
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "loan.delivered", Map.of("loanId", loan.getId().toString()));
        return mapLoan(loan);
    }

    @Transactional
    public LoanDtos.LoanResponse returnLoan(UUID loanId, LoanDtos.ReturnLoanPayload request) {
        currentContextService.requireManagerOrAdmin();
        LoanEntity loan = findLoan(loanId);
        if (loan.getStatus() != LoanStatus.DELIVERED && loan.getStatus() != LoanStatus.OVERDUE) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_LOAN_STATE", "Solo se pueden devolver prestamos entregados o vencidos.");
        }

        LoanItemEntity loanItem = loanItemRepository.findByLoanId(loan.getId()).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "LOAN_ITEM_MISSING", "El prestamo no tiene items."));
        ItemEntity item = loanItem.getItem();

        return closeLoanWithReturnedQuantity(loan, loanItem, item, request);
    }

    private LoanDtos.LoanResponse closeLoanWithReturnedQuantity(
            LoanEntity loan,
            LoanItemEntity loanItem,
            ItemEntity item,
            LoanDtos.ReturnLoanPayload request
    ) {
        BigDecimal returnedQuantity = requireNonNegative(request.returnedQuantity(), "RETURN_QUANTITY_INVALID", "La cantidad devuelta no puede ser negativa.");
        BigDecimal outstandingQuantity = loanItem.getQuantity().subtract(loanItem.getReturnedQuantity());

        if (returnedQuantity.compareTo(outstandingQuantity) > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "RETURN_EXCEEDS_PENDING", "La devolucion supera la cantidad pendiente del prestamo.");
        }

        String normalizedNotes = normalizeOptional(request.notes());
        BigDecimal missingQuantity = outstandingQuantity.subtract(returnedQuantity);
        if (missingQuantity.compareTo(BigDecimal.ZERO) > 0 && normalizedNotes == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "RETURN_NOTES_REQUIRED", "Si no regresa toda la cantidad prestada debes explicar el motivo en la nota de devolucion.");
        }

        item.setLoanedStock(item.getLoanedStock().subtract(outstandingQuantity));
        item.setAvailableStock(item.getAvailableStock().add(returnedQuantity));
        item.setTotalStock(item.getTotalStock().subtract(missingQuantity));
        item.setLastMovementAt(Instant.now());
        syncItemStatus(item);
        ensureStockIntegrity(item);
        itemRepository.save(item);

        loanItem.setReturnedQuantity(loanItem.getReturnedQuantity().add(outstandingQuantity));
        loanItem.setReturnedGoodQuantity(loanItem.getReturnedGoodQuantity().add(returnedQuantity));
        loanItem.setLostQuantity(loanItem.getLostQuantity().add(missingQuantity));
        loanItem.setReturnCondition(missingQuantity.compareTo(BigDecimal.ZERO) > 0 ? ReturnCondition.LOST : ReturnCondition.GOOD);
        loanItem.setReturnNotes(mergeNotes(loanItem.getReturnNotes(), normalizedNotes));
        loanItemRepository.save(loanItem);

        loan.setStatus(LoanStatus.RETURNED);
        loan.setReturnedAt(Instant.now());
        loan.setNotes(mergeNotes(loan.getNotes(), normalizedNotes));
        loanRepository.save(loan);

        auditService.log(
                currentContextService.currentOrganizationEntity(),
                currentContextService.currentActorEntity(),
                "LOAN",
                loan.getId(),
                "LOAN_RETURNED",
                Map.of(
                        "returnedQuantity", returnedQuantity,
                        "writtenOffQuantity", missingQuantity
                )
        );
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "loan.returned", Map.of("loanId", loan.getId().toString(), "completed", true));
        return mapLoan(loan);
    }

    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void markOverdueLoans() {
        loanRepository.findByStatusInAndDueAtBefore(List.of(LoanStatus.DELIVERED, LoanStatus.APPROVED), Instant.now())
                .forEach(loan -> {
                    if (loan.getStatus() == LoanStatus.DELIVERED) {
                        loan.setStatus(LoanStatus.OVERDUE);
                        loanRepository.save(loan);
                    }
                });
    }

    private LoanRequestEntity findLoanRequest(UUID id) {
        LoanRequestEntity loanRequest = loanRequestRepository.findByIdAndOrganizationId(id, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LOAN_REQUEST_NOT_FOUND", "Solicitud de prestamo no encontrada."));
        currentContextService.ensureAccessibleLocation(loanRequest.getItem().getPrimaryLocation().getId());
        return loanRequest;
    }

    private LoanEntity findLoan(UUID id) {
        LoanEntity loan = loanRepository.findByIdAndOrganizationId(id, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LOAN_NOT_FOUND", "Prestamo no encontrado."));
        LoanItemEntity loanItem = findLoanItem(loan);
        currentContextService.ensureAccessibleLocation(loanItem.getItem().getPrimaryLocation().getId());
        return loan;
    }

    private LoanItemEntity findLoanItem(LoanEntity loan) {
        return loanItemRepository.findByLoanId(loan.getId()).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "LOAN_ITEM_MISSING", "El prestamo no tiene items."));
    }

    private ItemEntity findLendableItem(String itemId) {
        ItemEntity item = itemRepository.findByIdAndOrganizationId(UUID.fromString(itemId), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND", "Item no encontrado."));
        currentContextService.ensureAccessibleLocation(item.getPrimaryLocation().getId());
        if (!item.isLendable()) {
            throw new ApiException(HttpStatus.CONFLICT, "ITEM_NOT_LENDABLE", "El item no admite prestamos.");
        }
        if (item.getStatus() == ItemStatus.ARCHIVED || item.getStatus() == ItemStatus.LOST || item.getStatus() == ItemStatus.MAINTENANCE) {
            throw new ApiException(HttpStatus.CONFLICT, "ITEM_UNAVAILABLE_FOR_LOAN", "El item no se encuentra disponible para prestamos.");
        }
        return item;
    }

    private void ensureAvailable(ItemEntity item, BigDecimal quantity) {
        if (item.getAvailableStock().compareTo(quantity) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "STOCK_INSUFFICIENT", "No hay stock suficiente para aprobar el prestamo.");
        }
    }

    private void ensureRequestable(ItemEntity item, BigDecimal quantity) {
        if (item.getAvailableStock().compareTo(quantity) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "STOCK_INSUFFICIENT", "La solicitud supera el stock disponible del articulo.");
        }
    }

    private LoanDtos.LoanRequestResponse mapLoanRequest(LoanRequestEntity entity) {
        return new LoanDtos.LoanRequestResponse(
                entity.getId().toString(),
                entity.getBorrower().getName(),
                entity.getItem().getName(),
                entity.getItem().getCategory().getId().toString(),
                entity.getItem().getCategory().getName(),
                entity.getItem().getUnit().getSymbol(),
                entity.getItem().getPrimaryLocation().getId().toString(),
                entity.getItem().getPrimaryLocation().getName(),
                entity.getQuantity(),
                entity.getStatus().name(),
                entity.getRequestedAt(),
                entity.getDueAt(),
                entity.getNotes()
        );
    }

    private LoanDtos.LoanResponse mapLoan(LoanEntity entity) {
        LoanItemEntity loanItem = loanItemRepository.findByLoanId(entity.getId()).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "LOAN_ITEM_MISSING", "El prestamo no tiene items."));
        return new LoanDtos.LoanResponse(
                entity.getId().toString(),
                entity.getBorrower().getName(),
                loanItem.getItem().getName(),
                loanItem.getItem().getCategory().getId().toString(),
                loanItem.getItem().getCategory().getName(),
                loanItem.getItem().getUnit().getSymbol(),
                loanItem.getItem().getPrimaryLocation().getId().toString(),
                loanItem.getItem().getPrimaryLocation().getName(),
                loanItem.getQuantity(),
                loanItem.getReturnedGoodQuantity(),
                loanItem.getQuantity().subtract(loanItem.getReturnedQuantity()),
                loanItem.getReturnCondition() == null ? null : loanItem.getReturnCondition().name(),
                entity.getStatus().name(),
                entity.getLoanRequest() == null ? null : entity.getLoanRequest().getRequestedAt(),
                entity.getCreatedAt(),
                entity.getDueAt(),
                entity.getLoanedAt(),
                entity.getReturnedAt(),
                entity.getNotes(),
                loanItem.getReturnNotes(),
                entity.getApprovedBy() == null ? null : entity.getApprovedBy().getFullName(),
                entity.getDeliveredBy() == null ? null : entity.getDeliveredBy().getFullName()
        );
    }

    private BigDecimal requireNonNegative(BigDecimal value, String code, String message) {
        if (value == null || value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, code, message);
        }
        return value;
    }

    private void validateEditableDates(LoanEntity loan, LoanDtos.UpdateLoanPayload request, Instant requestedAt) {
        if (request.dueAt().isBefore(requestedAt)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LOAN_DUE_BEFORE_REQUEST", "La fecha limite no puede quedar antes de la solicitud.");
        }

        if (loan.getStatus() == LoanStatus.APPROVED) {
            if (request.loanedAt() != null || request.returnedAt() != null) {
                throw new ApiException(HttpStatus.CONFLICT, "LOAN_APPROVED_DATES_LOCKED", "Un prestamo aprobado solo permite ajustar la fecha limite y las notas.");
            }
            return;
        }

        if (request.loanedAt() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LOANED_AT_REQUIRED", "Debes indicar la fecha de entrega para editar este prestamo.");
        }
        if (request.loanedAt().isBefore(requestedAt)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LOANED_AT_BEFORE_REQUEST", "La fecha de entrega no puede quedar antes de la solicitud.");
        }
        if (request.dueAt().isBefore(request.loanedAt())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LOAN_DUE_BEFORE_DELIVERY", "La fecha limite no puede quedar antes de la entrega.");
        }

        if (loan.getStatus() == LoanStatus.RETURNED) {
            if (request.returnedAt() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "RETURNED_AT_REQUIRED", "Debes indicar la fecha de cierre para un prestamo devuelto.");
            }
            if (request.returnedAt().isBefore(request.loanedAt())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "RETURNED_AT_BEFORE_DELIVERY", "La fecha de cierre no puede quedar antes de la entrega.");
            }
        } else if (request.returnedAt() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "RETURNED_AT_NOT_ALLOWED", "Solo puedes editar la fecha de cierre en prestamos ya devueltos.");
        }
    }

    private void syncItemStatus(ItemEntity item) {
        if (item.getLoanedStock().compareTo(BigDecimal.ZERO) > 0) {
            item.setStatus(ItemStatus.ON_LOAN);
            return;
        }
        if (item.getReservedStock().compareTo(BigDecimal.ZERO) > 0) {
            item.setStatus(ItemStatus.RESERVED);
            return;
        }
        if (item.getAvailableStock().compareTo(BigDecimal.ZERO) > 0) {
            item.setStatus(ItemStatus.AVAILABLE);
            return;
        }
        if (item.getTotalStock().compareTo(BigDecimal.ZERO) <= 0) {
            item.setStatus(ItemStatus.LOST);
            return;
        }
        item.setStatus(ItemStatus.AVAILABLE);
    }

    private void ensureStockIntegrity(ItemEntity item) {
        if (item.getTotalStock().compareTo(BigDecimal.ZERO) < 0
                || item.getAvailableStock().compareTo(BigDecimal.ZERO) < 0
                || item.getReservedStock().compareTo(BigDecimal.ZERO) < 0
                || item.getLoanedStock().compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "STOCK_NEGATIVE", "La operacion deja el inventario en un estado invalido.");
        }
    }

    private ReturnCondition resolveReturnCondition(LoanItemEntity loanItem) {
        if (loanItem.getLostQuantity().compareTo(BigDecimal.ZERO) > 0) {
            return ReturnCondition.LOST;
        }
        if (loanItem.getReturnedGoodQuantity().compareTo(BigDecimal.ZERO) > 0) {
            return ReturnCondition.GOOD;
        }
        return null;
    }

    private String mergeNotes(String currentValue, String newValue) {
        if (newValue == null || newValue.isBlank()) {
            return currentValue;
        }
        if (currentValue == null || currentValue.isBlank()) {
            return trimTo255(newValue.trim());
        }
        return trimTo255(currentValue + " | " + newValue.trim());
    }

    private String trimTo255(String value) {
        return value.length() <= 255 ? value : value.substring(0, 255);
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return trimTo255(value.trim());
    }
}
