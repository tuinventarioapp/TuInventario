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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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
        currentContextService.requireOperator();
        UUID effectiveLocationId = currentContextService.effectiveLocationId(locationId);
        return loanRequestRepository.findByOrganizationIdOrderByRequestedAtDesc(currentContextService.currentUser().organizationId())
                .stream()
                .filter(loanRequest -> effectiveLocationId == null || loanRequest.getItem().getPrimaryLocation().getId().equals(effectiveLocationId))
                .map(this::mapLoanRequest)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LoanDtos.LoanResponse> listLoans(UUID locationId) {
        currentContextService.requireOperator();
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
        currentContextService.requireOperator();
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
    public LoanDtos.BorrowerLoanGroupResponse createBorrowerLoanRequest(LoanDtos.BorrowerLoanCartPayload request) {
        currentContextService.requireBorrower();
        if (request.items() == null || request.items().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LOAN_ITEMS_REQUIRED", "Debes seleccionar al menos un articulo.");
        }

        BorrowerEntity borrower = findBorrowerProfileForCurrentUser();
        UUID groupId = UUID.randomUUID();
        Instant now = Instant.now();
        Set<UUID> seenItems = new HashSet<>();
        List<LoanRequestEntity> entities = new ArrayList<>();

        for (LoanDtos.BorrowerLoanCartItemPayload itemPayload : request.items()) {
            QuantityUtils.requirePositive(itemPayload.quantity());
            UUID itemId = UUID.fromString(itemPayload.itemId());
            if (!seenItems.add(itemId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "DUPLICATE_ITEM_IN_REQUEST", "No puedes solicitar el mismo articulo dos veces en una misma solicitud.");
            }

            ItemEntity item = findLendableItem(itemPayload.itemId());
            ensureRequestable(item, itemPayload.quantity());

            LoanRequestEntity entity = new LoanRequestEntity();
            entity.setOrganization(currentContextService.currentOrganizationEntity());
            entity.setBorrower(borrower);
            entity.setItem(item);
            entity.setQuantity(itemPayload.quantity());
            entity.setRequestedBy(currentContextService.currentActorEntity());
            entity.setStatus(LoanRequestStatus.PENDING);
            entity.setRequestedAt(now);
            entity.setDueAt(request.dueAt());
            entity.setNotes(normalizeOptional(request.notes()));
            entity.setRequestGroupId(groupId);
            entity.setApprovedQuantity(BigDecimal.ZERO);
            entities.add(loanRequestRepository.save(entity));
        }

        auditService.log(
                currentContextService.currentOrganizationEntity(),
                currentContextService.currentActorEntity(),
                "LOAN_REQUEST_GROUP",
                groupId,
                "BORROWER_LOAN_REQUEST_CREATED",
                Map.of("items", entities.size(), "dueAt", request.dueAt())
        );
        realtimePublisher.publish(
                currentContextService.currentUser().organizationId(),
                "borrower.loan-request.created",
                Map.of("groupId", groupId.toString())
        );
        return mapBorrowerLoanGroup(groupId, entities, List.of());
    }

    @Transactional(readOnly = true)
    public List<LoanDtos.BorrowerLoanGroupResponse> listBorrowerLoanRequests(UUID locationId) {
        currentContextService.requireManagerOrAdmin();
        UUID effectiveLocationId = currentContextService.effectiveLocationId(locationId);
        Map<UUID, List<LoanRequestEntity>> groupedRequests = groupLoanRequestsByGroupId(loanRequestRepository.findGroupedByOrganizationId(currentContextService.currentUser().organizationId()));
        Map<UUID, List<LoanEntity>> groupedLoans = groupLoansByGroupId(loanRepository.findGroupedByOrganizationId(currentContextService.currentUser().organizationId()));

        return groupedRequests.entrySet().stream()
                .map((entry) -> mapBorrowerLoanGroup(entry.getKey(), entry.getValue(), groupedLoans.getOrDefault(entry.getKey(), List.of())))
                .filter((group) -> effectiveLocationId == null || group.locationId().equals(effectiveLocationId.toString()))
                .sorted(Comparator.comparing(LoanDtos.BorrowerLoanGroupResponse::requestedAt).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LoanDtos.BorrowerLoanGroupResponse> listMyBorrowerLoanRequests() {
        currentContextService.requireBorrower();
        Map<UUID, List<LoanRequestEntity>> groupedRequests = groupLoanRequestsByGroupId(
                loanRequestRepository.findGroupedByRequestedBy(
                        currentContextService.currentUser().organizationId(),
                        currentContextService.currentUser().userId()
                )
        );
        Map<UUID, List<LoanEntity>> groupedLoans = groupLoansByGroupId(
                loanRepository.findGroupedByBorrowerUserId(
                        currentContextService.currentUser().organizationId(),
                        currentContextService.currentUser().userId()
                )
        );

        return groupedRequests.entrySet().stream()
                .map((entry) -> mapBorrowerLoanGroup(entry.getKey(), entry.getValue(), groupedLoans.getOrDefault(entry.getKey(), List.of())))
                .sorted(Comparator.comparing(LoanDtos.BorrowerLoanGroupResponse::requestedAt).reversed())
                .toList();
    }

    @Transactional
    public LoanDtos.BorrowerLoanGroupResponse reviewBorrowerLoanRequest(UUID groupId, LoanDtos.BorrowerLoanReviewPayload request) {
        currentContextService.requireManagerOrAdmin();
        List<LoanRequestEntity> groupedRequests = findGroupedLoanRequests(groupId);
        if (groupedRequests.stream().anyMatch(entry -> entry.getStatus() != LoanRequestStatus.PENDING)) {
            throw new ApiException(HttpStatus.CONFLICT, "GROUP_ALREADY_REVIEWED", "La solicitud ya fue revisada total o parcialmente.");
        }
        if (request.items() == null || request.items().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "REVIEW_ITEMS_REQUIRED", "Debes decidir el resultado de cada articulo solicitado.");
        }

        Map<UUID, LoanRequestEntity> requestMap = new HashMap<>();
        groupedRequests.forEach(entry -> requestMap.put(entry.getId(), entry));
        if (request.items().size() != groupedRequests.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INCOMPLETE_REVIEW", "Debes revisar cada articulo de la solicitud.");
        }

        Set<UUID> seenRequestIds = new HashSet<>();
        List<LoanEntity> createdLoans = new ArrayList<>();

        for (LoanDtos.BorrowerLoanReviewItemPayload itemReview : request.items()) {
            UUID loanRequestId = UUID.fromString(itemReview.loanRequestId());
            if (!seenRequestIds.add(loanRequestId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "DUPLICATE_REVIEW_ITEM", "No puedes revisar el mismo articulo dos veces.");
            }

            LoanRequestEntity loanRequest = requestMap.get(loanRequestId);
            if (loanRequest == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "REVIEW_ITEM_NOT_FOUND", "La solicitud incluye un articulo que no pertenece al grupo.");
            }

            String decision = itemReview.decision() == null ? "" : itemReview.decision().trim().toUpperCase();
            switch (decision) {
                case "APPROVE" -> {
                    BigDecimal approvedQuantity = requireNonNegative(
                            itemReview.approvedQuantity(),
                            "APPROVED_QUANTITY_INVALID",
                            "La cantidad aprobada no es valida."
                    );
                    if (approvedQuantity.compareTo(BigDecimal.ZERO) <= 0) {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "APPROVED_QUANTITY_REQUIRED", "Debes aprobar una cantidad mayor a cero.");
                    }
                    if (approvedQuantity.compareTo(loanRequest.getQuantity()) > 0) {
                        throw new ApiException(HttpStatus.CONFLICT, "APPROVED_QUANTITY_EXCEEDS_REQUEST", "La cantidad aprobada supera la solicitada.");
                    }

                    ItemEntity item = loanRequest.getItem();
                    ensureAvailable(item, approvedQuantity);
                    item.setAvailableStock(item.getAvailableStock().subtract(approvedQuantity));
                    item.setReservedStock(item.getReservedStock().add(approvedQuantity));
                    item.setStatus(ItemStatus.RESERVED);
                    item.setLastMovementAt(Instant.now());
                    ensureStockIntegrity(item);
                    itemRepository.save(item);

                    loanRequest.setStatus(LoanRequestStatus.APPROVED);
                    loanRequest.setApprovedQuantity(approvedQuantity);
                    loanRequest.setNotes(mergeNotes(loanRequest.getNotes(), normalizeOptional(request.notes())));
                    loanRequestRepository.save(loanRequest);

                    createdLoans.add(createApprovedLoan(loanRequest, approvedQuantity, groupId));
                }
                case "REJECT" -> {
                    String rejectionReason = normalizeOptional(itemReview.rejectionReason());
                    if (rejectionReason == null) {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "REJECTION_REASON_REQUIRED", "Debes indicar el motivo del rechazo.");
                    }
                    loanRequest.setStatus(LoanRequestStatus.REJECTED);
                    loanRequest.setApprovedQuantity(BigDecimal.ZERO);
                    loanRequest.setNotes(mergeNotes(loanRequest.getNotes(), "Motivo de rechazo: " + rejectionReason));
                    loanRequestRepository.save(loanRequest);
                }
                default -> throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_REVIEW_DECISION", "La decision debe ser APPROVE o REJECT.");
            }
        }

        auditService.log(
                currentContextService.currentOrganizationEntity(),
                currentContextService.currentActorEntity(),
                "LOAN_REQUEST_GROUP",
                groupId,
                "BORROWER_LOAN_REQUEST_REVIEWED",
                Map.of("approvedLoans", createdLoans.size(), "totalItems", groupedRequests.size())
        );
        realtimePublisher.publish(
                currentContextService.currentUser().organizationId(),
                "borrower.loan-request.reviewed",
                Map.of("groupId", groupId.toString())
        );
        return mapBorrowerLoanGroup(groupId, groupedRequests, loanRepository.findByOrganizationIdAndRequestGroupIdOrderByCreatedAtAsc(currentContextService.currentUser().organizationId(), groupId));
    }

    @Transactional
    public LoanDtos.BorrowerLoanGroupResponse deliverBorrowerLoanGroup(UUID groupId, LoanDtos.LoanActionPayload request) {
        currentContextService.requireManagerOrAdmin();
        List<LoanRequestEntity> groupedRequests = findGroupedLoanRequests(groupId);
        List<LoanEntity> groupedLoans = findGroupedLoans(groupId);
        List<LoanEntity> loansToDeliver = groupedLoans.stream()
                .filter(loan -> loan.getStatus() == LoanStatus.APPROVED)
                .toList();

        if (loansToDeliver.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "NO_APPROVED_LOANS_TO_DELIVER", "No hay articulos aprobados pendientes por entregar.");
        }

        String notes = normalizeOptional(request.notes());
        for (LoanEntity loan : loansToDeliver) {
            deliverSingleLoan(loan, findLoanItem(loan), notes);
        }

        return mapBorrowerLoanGroup(groupId, groupedRequests, loanRepository.findByOrganizationIdAndRequestGroupIdOrderByCreatedAtAsc(currentContextService.currentUser().organizationId(), groupId));
    }

    @Transactional
    public LoanDtos.BorrowerLoanGroupResponse returnBorrowerLoanGroup(UUID groupId, LoanDtos.BorrowerLoanReturnPayload request) {
        currentContextService.requireManagerOrAdmin();
        List<LoanRequestEntity> groupedRequests = findGroupedLoanRequests(groupId);
        List<LoanEntity> groupedLoans = findGroupedLoans(groupId);
        Map<UUID, LoanEntity> loanMap = new HashMap<>();
        groupedLoans.forEach(loan -> loanMap.put(loan.getId(), loan));

        List<LoanEntity> returnableLoans = groupedLoans.stream()
                .filter(loan -> loan.getStatus() == LoanStatus.DELIVERED || loan.getStatus() == LoanStatus.OVERDUE)
                .toList();
        if (returnableLoans.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "NO_LOANS_TO_RETURN", "No hay articulos pendientes por devolver en este prestamo.");
        }
        if (request.items() == null || request.items().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "RETURN_ITEMS_REQUIRED", "Debes indicar la devolucion de cada articulo entregado.");
        }
        if (request.items().size() != returnableLoans.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INCOMPLETE_RETURN", "Debes registrar la devolucion de cada articulo entregado.");
        }

        Set<UUID> seenLoanIds = new HashSet<>();
        for (LoanDtos.BorrowerLoanReturnItemPayload itemReturn : request.items()) {
            UUID loanId = UUID.fromString(itemReturn.loanId());
            if (!seenLoanIds.add(loanId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "DUPLICATE_RETURN_ITEM", "No puedes registrar la devolucion del mismo articulo dos veces.");
            }
            LoanEntity loan = loanMap.get(loanId);
            if (loan == null || (loan.getStatus() != LoanStatus.DELIVERED && loan.getStatus() != LoanStatus.OVERDUE)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "RETURN_ITEM_NOT_FOUND", "La devolucion incluye un articulo que no pertenece al prestamo entregado.");
            }
            LoanItemEntity loanItem = findLoanItem(loan);
            closeLoanWithReturnedQuantity(
                    loan,
                    loanItem,
                    loanItem.getItem(),
                    new LoanDtos.ReturnLoanPayload(itemReturn.returnedQuantity(), itemReturn.notes())
            );
        }

        return mapBorrowerLoanGroup(groupId, groupedRequests, loanRepository.findByOrganizationIdAndRequestGroupIdOrderByCreatedAtAsc(currentContextService.currentUser().organizationId(), groupId));
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
        loanRequest.setApprovedQuantity(loanRequest.getQuantity());
        loanRequest.setNotes(request.notes() == null ? loanRequest.getNotes() : request.notes());
        loanRequestRepository.save(loanRequest);

        LoanEntity loan = createApprovedLoan(loanRequest, loanRequest.getQuantity(), loanRequest.getRequestGroupId());

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
        loan.setRequestGroupId(loanRequest.getRequestGroupId());
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

        LoanItemEntity loanItem = findLoanItem(loan);
        deliverSingleLoan(loan, loanItem, normalizeOptional(request.notes()));
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

    private LoanEntity createApprovedLoan(LoanRequestEntity loanRequest, BigDecimal approvedQuantity, UUID requestGroupId) {
        LoanEntity loan = new LoanEntity();
        loan.setOrganization(loanRequest.getOrganization());
        loan.setBorrower(loanRequest.getBorrower());
        loan.setLoanRequest(loanRequest);
        loan.setStatus(LoanStatus.APPROVED);
        loan.setApprovedBy(currentContextService.currentActorEntity());
        loan.setDueAt(loanRequest.getDueAt());
        loan.setNotes(loanRequest.getNotes());
        loan.setRequestGroupId(requestGroupId);
        loanRepository.save(loan);

        LoanItemEntity loanItem = new LoanItemEntity();
        loanItem.setLoan(loan);
        loanItem.setItem(loanRequest.getItem());
        loanItem.setQuantity(approvedQuantity);
        loanItem.setReturnedQuantity(BigDecimal.ZERO);
        loanItem.setReturnedGoodQuantity(BigDecimal.ZERO);
        loanItem.setLostQuantity(BigDecimal.ZERO);
        loanItemRepository.save(loanItem);
        return loan;
    }

    private void deliverSingleLoan(LoanEntity loan, LoanItemEntity loanItem, String notes) {
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
        loan.setNotes(mergeNotes(loan.getNotes(), notes));
        loanRepository.save(loan);

        auditService.log(
                currentContextService.currentOrganizationEntity(),
                currentContextService.currentActorEntity(),
                "LOAN",
                loan.getId(),
                "LOAN_DELIVERED",
                Map.of("itemId", item.getId())
        );
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "loan.delivered", Map.of("loanId", loan.getId().toString()));
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

    private BorrowerEntity findBorrowerProfileForCurrentUser() {
        return borrowerRepository.findByUserIdAndOrganizationIdAndDeletedAtIsNull(
                        currentContextService.currentUser().userId(),
                        currentContextService.currentUser().organizationId()
                )
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "BORROWER_PROFILE_NOT_FOUND", "Tu cuenta prestataria aun no tiene un perfil habilitado."));
    }

    private List<LoanRequestEntity> findGroupedLoanRequests(UUID groupId) {
        List<LoanRequestEntity> entries = loanRequestRepository.findByOrganizationIdAndRequestGroupIdOrderByCreatedAtAsc(
                currentContextService.currentUser().organizationId(),
                groupId
        );
        if (entries.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "LOAN_REQUEST_GROUP_NOT_FOUND", "La solicitud agrupada no fue encontrada.");
        }
        currentContextService.ensureAccessibleLocation(entries.get(0).getItem().getPrimaryLocation().getId());
        return entries;
    }

    private List<LoanEntity> findGroupedLoans(UUID groupId) {
        List<LoanEntity> loans = loanRepository.findByOrganizationIdAndRequestGroupIdOrderByCreatedAtAsc(
                currentContextService.currentUser().organizationId(),
                groupId
        );
        if (!loans.isEmpty()) {
            currentContextService.ensureAccessibleLocation(findLoanItem(loans.get(0)).getItem().getPrimaryLocation().getId());
        }
        return loans;
    }

    private Map<UUID, List<LoanRequestEntity>> groupLoanRequestsByGroupId(List<LoanRequestEntity> requests) {
        Map<UUID, List<LoanRequestEntity>> grouped = new LinkedHashMap<>();
        requests.stream()
                .filter(entry -> entry.getRequestGroupId() != null)
                .forEach(entry -> grouped.computeIfAbsent(entry.getRequestGroupId(), ignored -> new ArrayList<>()).add(entry));
        return grouped;
    }

    private Map<UUID, List<LoanEntity>> groupLoansByGroupId(List<LoanEntity> loans) {
        Map<UUID, List<LoanEntity>> grouped = new HashMap<>();
        loans.stream()
                .filter(entry -> entry.getRequestGroupId() != null)
                .forEach(entry -> grouped.computeIfAbsent(entry.getRequestGroupId(), ignored -> new ArrayList<>()).add(entry));
        return grouped;
    }

    private LoanDtos.BorrowerLoanGroupResponse mapBorrowerLoanGroup(UUID groupId, List<LoanRequestEntity> requests, List<LoanEntity> loans) {
        if (requests.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "LOAN_REQUEST_GROUP_NOT_FOUND", "La solicitud agrupada no fue encontrada.");
        }

        LoanRequestEntity firstRequest = requests.get(0);
        Map<UUID, LoanEntity> loansByRequestId = new HashMap<>();
        for (LoanEntity loan : loans) {
            if (loan.getLoanRequest() != null) {
                loansByRequestId.put(loan.getLoanRequest().getId(), loan);
            }
        }

        List<LoanDtos.BorrowerLoanGroupItemResponse> items = requests.stream()
                .map(request -> mapBorrowerLoanGroupItem(request, loansByRequestId.get(request.getId())))
                .toList();

        Instant approvedAt = loans.stream().map(LoanEntity::getCreatedAt).filter(Objects::nonNull).min(Comparator.naturalOrder()).orElse(null);
        Instant loanedAt = loans.stream().map(LoanEntity::getLoanedAt).filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null);
        Instant returnedAt = loans.stream().map(LoanEntity::getReturnedAt).filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null);
        String status = deriveBorrowerGroupStatus(requests, loans);
        boolean dueSoon = firstRequest.getDueAt() != null
                && (status.equals("APPROVED") || status.equals("PARTIALLY_APPROVED") || status.equals("DELIVERED") || status.equals("OVERDUE"))
                && !firstRequest.getDueAt().isBefore(Instant.now())
                && !firstRequest.getDueAt().isAfter(Instant.now().plus(3, ChronoUnit.DAYS));

        return new LoanDtos.BorrowerLoanGroupResponse(
                groupId.toString(),
                firstRequest.getBorrower().getName(),
                firstRequest.getItem().getPrimaryLocation().getId().toString(),
                firstRequest.getItem().getPrimaryLocation().getName(),
                status,
                firstRequest.getRequestedAt(),
                approvedAt,
                firstRequest.getDueAt(),
                loanedAt,
                returnedAt,
                firstRequest.getNotes(),
                dueSoon,
                items
        );
    }

    private LoanDtos.BorrowerLoanGroupItemResponse mapBorrowerLoanGroupItem(LoanRequestEntity request, LoanEntity loan) {
        LoanItemEntity loanItem = loan == null ? null : findLoanItem(loan);
        BigDecimal approvedQuantity = request.getApprovedQuantity() != null && request.getApprovedQuantity().compareTo(BigDecimal.ZERO) > 0
                ? request.getApprovedQuantity()
                : loanItem == null ? BigDecimal.ZERO : loanItem.getQuantity();
        BigDecimal returnedQuantity = loanItem == null ? BigDecimal.ZERO : loanItem.getReturnedGoodQuantity();
        BigDecimal outstandingQuantity = loanItem == null ? BigDecimal.ZERO : loanItem.getQuantity().subtract(loanItem.getReturnedQuantity());

        return new LoanDtos.BorrowerLoanGroupItemResponse(
                request.getId().toString(),
                loan == null ? null : loan.getId().toString(),
                request.getItem().getId().toString(),
                request.getItem().getName(),
                request.getItem().getCategory().getName(),
                request.getItem().getUnit().getSymbol(),
                request.getQuantity(),
                approvedQuantity,
                returnedQuantity,
                outstandingQuantity,
                loan == null ? request.getStatus().name() : loan.getStatus().name(),
                extractRejectionReason(request)
        );
    }

    private String deriveBorrowerGroupStatus(List<LoanRequestEntity> requests, List<LoanEntity> loans) {
        long approvedRequests = requests.stream().filter(entry -> entry.getStatus() == LoanRequestStatus.APPROVED).count();
        long rejectedRequests = requests.stream().filter(entry -> entry.getStatus() == LoanRequestStatus.REJECTED).count();
        long pendingRequests = requests.stream().filter(entry -> entry.getStatus() == LoanRequestStatus.PENDING).count();

        if (pendingRequests == requests.size()) {
            return "PENDING";
        }
        if (approvedRequests == 0 && rejectedRequests == requests.size()) {
            return "REJECTED";
        }
        if (loans.stream().anyMatch(loan -> loan.getStatus() == LoanStatus.OVERDUE)) {
            return "OVERDUE";
        }
        if (loans.stream().anyMatch(loan -> loan.getStatus() == LoanStatus.DELIVERED)) {
            return "DELIVERED";
        }
        boolean hasActiveApproval = loans.stream().anyMatch(loan -> loan.getStatus() == LoanStatus.APPROVED);
        boolean allReturned = !loans.isEmpty() && loans.stream().allMatch(loan -> loan.getStatus() == LoanStatus.RETURNED || loan.getStatus() == LoanStatus.REJECTED);
        if (allReturned && pendingRequests == 0) {
            return "RETURNED";
        }
        if (hasActiveApproval && rejectedRequests > 0) {
            return "PARTIALLY_APPROVED";
        }
        if (hasActiveApproval) {
            return "APPROVED";
        }
        if (rejectedRequests > 0 && approvedRequests > 0) {
            return "PARTIALLY_APPROVED";
        }
        return "PENDING";
    }

    private String extractRejectionReason(LoanRequestEntity request) {
        if (request.getStatus() != LoanRequestStatus.REJECTED || request.getNotes() == null) {
            return null;
        }
        String marker = "Motivo de rechazo: ";
        int markerIndex = request.getNotes().lastIndexOf(marker);
        if (markerIndex >= 0) {
            return request.getNotes().substring(markerIndex + marker.length()).trim();
        }
        return request.getNotes();
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
