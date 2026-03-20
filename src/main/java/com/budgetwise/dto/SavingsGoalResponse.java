package com.budgetwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingsGoalResponse {
    private String id;
    private String name;
    private Double targetAmount;
    private Double currentAmount;
    private Double progressPercentage;
    private LocalDate deadline;
    private LocalDate createdAt;
}
