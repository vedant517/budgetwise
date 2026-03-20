package com.budgetwise.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Document(collection = "incomes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Income {
    
    @Id
    private String id;
    
    @DBRef
    private User user;
    
    private String description;
    
    private Double amount;
    
    private String category;
    
    private LocalDateTime createdAt;
}
