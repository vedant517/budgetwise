package com.budgetwise.controller;

import com.budgetwise.dto.IncomeRequest;
import com.budgetwise.model.Income;
import com.budgetwise.model.User;
import com.budgetwise.repository.IncomeRepository;
import com.budgetwise.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/incomes")
public class IncomeController {

    private final IncomeRepository incomeRepository;
    private final UserRepository userRepository;

    public IncomeController(IncomeRepository incomeRepository, UserRepository userRepository) {
        this.incomeRepository = incomeRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Income>> getIncomes() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Income> incomes = incomeRepository.findByUser(user);
        return ResponseEntity.ok(incomes);
    }

    @PostMapping
    public ResponseEntity<Income> addIncome(@RequestBody IncomeRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Income income = Income.builder()
                .user(user)
                .description(request.getDescription())
                .amount(request.getAmount())
                .category(request.getCategory())
                .createdAt(LocalDateTime.now())
                .build();

        Income saved = incomeRepository.save(income);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Income> updateIncome(@PathVariable String id, @RequestBody IncomeRequest request) {
        return incomeRepository.findById(id)
                .map(income -> {
                    income.setDescription(request.getDescription());
                    income.setAmount(request.getAmount());
                    income.setCategory(request.getCategory());
                    return ResponseEntity.ok(incomeRepository.save(income));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncome(@PathVariable String id) {
        if (incomeRepository.existsById(id)) {
            incomeRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
