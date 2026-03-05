package com.budgetwise.controller;

import com.budgetwise.model.User;
import com.budgetwise.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<User> getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getUserByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    public ResponseEntity<User> updateProfile(
            @RequestParam Double income,
            @RequestParam Double savingsGoal,
            @RequestParam Double targetExpenses) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User updated = userService.updateUserProfile(email, income, savingsGoal, targetExpenses);
        return ResponseEntity.ok(updated);
    }
}
