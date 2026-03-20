package com.budgetwise.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Document(collection = "savings_goals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingsGoal {
    
    @Id
    private String id;
    
    @DBRef
    private User user;
    
    private String name;
    
    private Double targetAmount;
    
    private Double currentAmount;
    
    private LocalDate deadline;
    
    private LocalDate createdAt;
}
