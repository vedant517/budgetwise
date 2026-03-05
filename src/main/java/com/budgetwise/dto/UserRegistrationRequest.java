package com.budgetwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRegistrationRequest {
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private Double income;
    private Double savingsGoal;
    private Double targetExpenses;
}
