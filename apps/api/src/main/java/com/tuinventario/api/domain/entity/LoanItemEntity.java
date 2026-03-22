package com.tuinventario.api.domain.entity;

import com.tuinventario.api.domain.enums.ReturnCondition;
import com.tuinventario.api.shared.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "loan_items")
public class LoanItemEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_id")
    private LoanEntity loan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id")
    private ItemEntity item;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal quantity;

    @Column(name = "returned_quantity", nullable = false, precision = 19, scale = 2)
    private BigDecimal returnedQuantity;

    @Column(name = "returned_good_quantity", nullable = false, precision = 19, scale = 2)
    private BigDecimal returnedGoodQuantity;

    @Column(name = "returned_damaged_quantity", nullable = false, precision = 19, scale = 2)
    private BigDecimal returnedDamagedQuantity;

    @Column(name = "lost_quantity", nullable = false, precision = 19, scale = 2)
    private BigDecimal lostQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "return_condition", length = 40)
    private ReturnCondition returnCondition;

    @Column(name = "return_notes", length = 255)
    private String returnNotes;
}
