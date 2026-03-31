package com.tuinventario.api.loan;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @GetMapping("/loan-requests")
    public List<LoanDtos.LoanRequestResponse> listLoanRequests(@RequestParam(required = false) UUID locationId) {
        return loanService.listLoanRequests(locationId);
    }

    @PostMapping("/loan-requests")
    public LoanDtos.LoanRequestResponse createLoanRequest(@Valid @RequestBody LoanDtos.LoanRequestPayload request) {
        return loanService.createLoanRequest(request);
    }

    @PostMapping("/public-loan-requests")
    public LoanDtos.LoanRequestResponse createPublicLoanRequest(@Valid @RequestBody LoanDtos.PublicLoanRequestPayload request) {
        return loanService.createPublicLoanRequest(request);
    }

    @PostMapping("/loan-requests/{id}/approve")
    public LoanDtos.LoanResponse approveLoanRequest(@PathVariable UUID id, @RequestBody(required = false) LoanDtos.LoanActionPayload request) {
        return loanService.approveLoanRequest(id, request == null ? new LoanDtos.LoanActionPayload(null) : request);
    }

    @PostMapping("/loan-requests/{id}/reject")
    public LoanDtos.LoanResponse rejectLoanRequest(@PathVariable UUID id, @RequestBody(required = false) LoanDtos.LoanActionPayload request) {
        return loanService.rejectLoanRequest(id, request == null ? new LoanDtos.LoanActionPayload(null) : request);
    }

    @GetMapping("/loans")
    public List<LoanDtos.LoanResponse> listLoans(@RequestParam(required = false) UUID locationId) {
        return loanService.listLoans(locationId);
    }

    @PutMapping("/loans/{id}")
    public LoanDtos.LoanResponse updateLoan(@PathVariable UUID id, @Valid @RequestBody LoanDtos.UpdateLoanPayload request) {
        return loanService.updateLoan(id, request);
    }

    @PostMapping("/loans/{id}/deliver")
    public LoanDtos.LoanResponse deliverLoan(@PathVariable UUID id, @RequestBody(required = false) LoanDtos.LoanActionPayload request) {
        return loanService.deliverLoan(id, request == null ? new LoanDtos.LoanActionPayload(null) : request);
    }

    @PostMapping("/loans/{id}/return")
    public LoanDtos.LoanResponse returnLoan(@PathVariable UUID id, @Valid @RequestBody LoanDtos.ReturnLoanPayload request) {
        return loanService.returnLoan(id, request);
    }
}
