package com.budgetwise.controller;

import com.budgetwise.dto.BudgetRequest;
import com.budgetwise.dto.BudgetResponse;
import com.budgetwise.model.Budget;
import com.budgetwise.model.User;
import com.budgetwise.repository.BudgetRepository;
import com.budgetwise.repository.ExpenseRepository;
import com.budgetwise.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public BudgetController(BudgetRepository budgetRepository, ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.budgetRepository = budgetRepository;
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getBudgets(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int queryMonth = (month != null) ? month : LocalDate.now().getMonthValue();
        int queryYear = (year != null) ? year : LocalDate.now().getYear();

        List<Budget> budgets = budgetRepository.findByUserAndMonthAndYear(user, queryMonth, queryYear);
        
        List<BudgetResponse> responses = budgets.stream()
                .map(budget -> mapToResponse(user, budget))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> setBudget(@RequestBody BudgetRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Budget> existing = budgetRepository.findByUserAndCategoryAndMonthAndYear(
                user, request.getCategory(), request.getMonth(), request.getYear());

        Budget budget;
        if (existing.isPresent()) {
            budget = existing.get();
            budget.setAmount(request.getAmount());
        } else {
            budget = Budget.builder()
                    .user(user)
                    .category(request.getCategory())
                    .amount(request.getAmount())
                    .month(request.getMonth())
                    .year(request.getYear())
                    .build();
        }

        Budget saved = budgetRepository.save(budget);
        return ResponseEntity.ok(mapToResponse(user, saved));
    }

    private BudgetResponse mapToResponse(User user, Budget budget) {
        // Since we moved to Mongo, we calculate the sum in code for now
        Double spent = expenseRepository.findByUserAndCategory(user, budget.getCategory()).stream()
                .filter(e -> e.getCreatedAt() != null && 
                            e.getCreatedAt().getMonthValue() == budget.getMonth() && 
                            e.getCreatedAt().getYear() == budget.getYear())
                .mapToDouble(com.budgetwise.model.Expense::getAmount)
                .sum();
        
        return BudgetResponse.builder()
                .id(budget.getId())
                .category(budget.getCategory())
                .budgetAmount(budget.getAmount())
                .spentAmount(spent)
                .remainingAmount(budget.getAmount() - spent)
                .month(budget.getMonth())
                .year(budget.getYear())
                .build();
    }
}
