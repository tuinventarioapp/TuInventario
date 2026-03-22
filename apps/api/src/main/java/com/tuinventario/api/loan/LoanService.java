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
    public List<LoanDtos.LoanRequestResponse> listLoanRequests() {
        return loanRequestRepository.findByOrganizationIdOrderByRequestedAtDesc(currentContextService.currentUser().organizationId())
                .stream()
                .map(this::mapLoanRequest)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LoanDtos.LoanResponse> listLoans() {
        return loanRepository.findByOrganizationIdOrderByCreatedAtDesc(currentContextService.currentUser().organizationId())
                .stream()
                .map(this::mapLoan)
                .toList();
    }

    @Transactional
    public LoanDtos.LoanRequestResponse createLoanRequest(LoanDtos.LoanRequestPayload request) {
        QuantityUtils.requirePositive(request.quantity());
        BorrowerEntity borrower = borrowerRepository.findByIdAndOrganizationId(UUID.fromString(request.borrowerId()), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BORROWER_NOT_FOUND", "Prestatario no encontrado."));
        ItemEntity item = findLendableItem(request.itemId());

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

        BorrowerEntity borrower = borrowerRepository.findByOrganizationIdOrderByNameAsc(item.getOrganization().getId()).stream()
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
        loanItemRepository.save(loanItem);

        auditService.log(currentContextService.currentOrganizationEntity(), currentContextService.currentActorEntity(), "LOAN", loan.getId(), "LOAN_APPROVED", Map.of("loanRequestId", loanRequestId));
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "loan.approved", Map.of("loanId", loan.getId().toString()));
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
        itemRepository.save(item);

        loan.setStatus(LoanStatus.DELIVERED);
        loan.setDeliveredBy(currentContextService.currentActorEntity());
        loan.setLoanedAt(Instant.now());
        if (request.notes() != null && !request.notes().isBlank()) {
            loan.setNotes(request.notes());
        }
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

        item.setLoanedStock(item.getLoanedStock().subtract(loanItem.getQuantity()));
        if (request.returnCondition() == ReturnCondition.GOOD) {
            item.setAvailableStock(item.getAvailableStock().add(loanItem.getQuantity()));
            item.setStatus(ItemStatus.AVAILABLE);
        } else if (request.returnCondition() == ReturnCondition.DAMAGED) {
            item.setStatus(ItemStatus.DAMAGED);
        } else {
            item.setTotalStock(item.getTotalStock().subtract(loanItem.getQuantity()));
            item.setStatus(ItemStatus.LOST);
        }
        itemRepository.save(item);

        loanItem.setReturnedQuantity(loanItem.getQuantity());
        loanItem.setReturnCondition(request.returnCondition());
        loanItemRepository.save(loanItem);

        loan.setStatus(LoanStatus.RETURNED);
        loan.setReturnedAt(Instant.now());
        if (request.notes() != null && !request.notes().isBlank()) {
            loan.setNotes(request.notes());
        }
        loanRepository.save(loan);

        auditService.log(currentContextService.currentOrganizationEntity(), currentContextService.currentActorEntity(), "LOAN", loan.getId(), "LOAN_RETURNED", Map.of("condition", request.returnCondition().name()));
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "loan.returned", Map.of("loanId", loan.getId().toString()));
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
        return loanRequestRepository.findByIdAndOrganizationId(id, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LOAN_REQUEST_NOT_FOUND", "Solicitud de prestamo no encontrada."));
    }

    private LoanEntity findLoan(UUID id) {
        return loanRepository.findByIdAndOrganizationId(id, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LOAN_NOT_FOUND", "Prestamo no encontrado."));
    }

    private ItemEntity findLendableItem(String itemId) {
        ItemEntity item = itemRepository.findByIdAndOrganizationId(UUID.fromString(itemId), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND", "Item no encontrado."));
        if (!item.isLendable()) {
            throw new ApiException(HttpStatus.CONFLICT, "ITEM_NOT_LENDABLE", "El item no admite prestamos.");
        }
        return item;
    }

    private void ensureAvailable(ItemEntity item, BigDecimal quantity) {
        if (item.getAvailableStock().compareTo(quantity) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "STOCK_INSUFFICIENT", "No hay stock suficiente para aprobar el prestamo.");
        }
    }

    private LoanDtos.LoanRequestResponse mapLoanRequest(LoanRequestEntity entity) {
        return new LoanDtos.LoanRequestResponse(
                entity.getId().toString(),
                entity.getBorrower().getName(),
                entity.getItem().getName(),
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
                loanItem.getQuantity(),
                entity.getStatus().name(),
                entity.getDueAt(),
                entity.getLoanedAt(),
                entity.getReturnedAt(),
                entity.getNotes()
        );
    }
}
