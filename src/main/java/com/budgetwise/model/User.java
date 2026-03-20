package com.budgetwise.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    private String id;
    
    private String email;
    
    private String password;
    
    private String firstName;
    
    private String lastName;
    
    private Role role;
    
    private Double income;
    
    private Double savingsGoal;
    
    private Double targetExpenses;
    
    private boolean enabled;
}
