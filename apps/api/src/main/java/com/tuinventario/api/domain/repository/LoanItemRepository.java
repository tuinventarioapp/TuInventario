package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.LoanItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LoanItemRepository extends JpaRepository<LoanItemEntity, UUID> {
    List<LoanItemEntity> findByLoanId(UUID loanId);
}
