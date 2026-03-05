package com.budgetwise.controller;

import com.budgetwise.dto.ExpenseRequest;
import com.budgetwise.model.Expense;
import com.budgetwise.model.User;
import com.budgetwise.repository.ExpenseRepository;
import com.budgetwise.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public ExpenseController(ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Expense>> getExpenses() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Expense> expenses = expenseRepository.findByUser(user);
        return ResponseEntity.ok(expenses);
    }

    @PostMapping
    public ResponseEntity<Expense> addExpense(@RequestBody ExpenseRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Expense expense = Expense.builder()
                .user(user)
                .description(request.getDescription())
                .amount(request.getAmount())
                .category(request.getCategory())
                .createdAt(LocalDateTime.now())
                .build();

        Expense saved = expenseRepository.save(expense);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpense(@PathVariable Long id) {
        return expenseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
