package com.budgetwise.controller;

import com.budgetwise.dto.SavingsGoalRequest;
import com.budgetwise.dto.SavingsGoalResponse;
import com.budgetwise.model.SavingsGoal;
import com.budgetwise.model.User;
import com.budgetwise.repository.SavingsGoalRepository;
import com.budgetwise.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/savings-goals")
public class SavingsGoalController {

    private final SavingsGoalRepository savingsGoalRepository;
    private final UserRepository userRepository;

    public SavingsGoalController(SavingsGoalRepository savingsGoalRepository, UserRepository userRepository) {
        this.savingsGoalRepository = savingsGoalRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<SavingsGoalResponse>> getGoals() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<SavingsGoal> goals = savingsGoalRepository.findByUser(user);
        
        List<SavingsGoalResponse> responses = goals.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @PostMapping
    public ResponseEntity<SavingsGoalResponse> addGoal(@RequestBody SavingsGoalRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SavingsGoal goal = SavingsGoal.builder()
                .user(user)
                .name(request.getName())
                .targetAmount(request.getTargetAmount())
                .currentAmount(request.getCurrentAmount() != null ? request.getCurrentAmount() : 0.0)
                .deadline(request.getDeadline())
                .createdAt(LocalDate.now())
                .build();

        SavingsGoal saved = savingsGoalRepository.save(goal);
        return ResponseEntity.ok(mapToResponse(saved));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<SavingsGoalResponse> updateProgress(@PathVariable String id, @RequestParam Double amount) {
        return savingsGoalRepository.findById(id)
                .map(goal -> {
                    goal.setCurrentAmount(goal.getCurrentAmount() + amount);
                    return ResponseEntity.ok(mapToResponse(savingsGoalRepository.save(goal)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavingsGoalResponse> updateGoal(@PathVariable String id, @RequestBody SavingsGoalRequest request) {
        return savingsGoalRepository.findById(id)
                .map(goal -> {
                    goal.setName(request.getName());
                    goal.setTargetAmount(request.getTargetAmount());
                    if (request.getCurrentAmount() != null) goal.setCurrentAmount(request.getCurrentAmount());
                    goal.setDeadline(request.getDeadline());
                    return ResponseEntity.ok(mapToResponse(savingsGoalRepository.save(goal)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(@PathVariable String id) {
        if (savingsGoalRepository.existsById(id)) {
            savingsGoalRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    private SavingsGoalResponse mapToResponse(SavingsGoal goal) {
        Double progress = (goal.getTargetAmount() > 0) 
            ? (goal.getCurrentAmount() / goal.getTargetAmount()) * 100 
            : 0.0;

        return SavingsGoalResponse.builder()
                .id(goal.getId())
                .name(goal.getName())
                .targetAmount(goal.getTargetAmount())
                .currentAmount(goal.getCurrentAmount())
                .progressPercentage(progress)
                .deadline(goal.getDeadline())
                .createdAt(goal.getCreatedAt())
                .build();
    }
}
