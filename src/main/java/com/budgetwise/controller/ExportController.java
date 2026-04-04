package com.budgetwise.controller;

import com.budgetwise.model.Expense;
import com.budgetwise.model.Income;
import com.budgetwise.model.User;
import com.budgetwise.repository.ExpenseRepository;
import com.budgetwise.repository.IncomeRepository;
import com.budgetwise.repository.UserRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final UserRepository userRepository;

    public ExportController(ExpenseRepository expenseRepository, IncomeRepository incomeRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.incomeRepository = incomeRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/csv")
    public ResponseEntity<byte[]> exportCSV() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        List<Expense> expenses = expenseRepository.findByUser(user);
        
        StringBuilder csv = new StringBuilder("Date,Description,Category,Amount\n");
        for (Expense e : expenses) {
            csv.append(e.getCreatedAt()).append(",")
               .append(e.getDescription()).append(",")
               .append(e.getCategory()).append(",")
               .append(e.getAmount()).append("\n");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=budgetwise_export.csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(csv.toString().getBytes());
    }

    @GetMapping("/backup")
    public ResponseEntity<Map<String, Object>> getFullBackup() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        
        Map<String, Object> backup = new HashMap<>();
        backup.put("user", user);
        backup.put("expenses", expenseRepository.findByUser(user));
        backup.put("incomes", incomeRepository.findByUser(user));
        
        return ResponseEntity.ok(backup);
    }
}
