package com.budgetwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetResponse {
    private String id;
    private String category;
    private Double budgetAmount;
    private Double spentAmount;
    private Double remainingAmount;
    private Integer month;
    private Integer year;
}
