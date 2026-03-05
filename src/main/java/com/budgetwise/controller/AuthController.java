package com.budgetwise.controller;

import com.budgetwise.dto.AuthResponse;
import com.budgetwise.dto.LoginRequest;
import com.budgetwise.dto.UserRegistrationRequest;
import com.budgetwise.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody UserRegistrationRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/init")
    public ResponseEntity<String> initializeUsers() {
        authService.createAdminUser();
        return ResponseEntity.ok("Users initialized");
    }
}
