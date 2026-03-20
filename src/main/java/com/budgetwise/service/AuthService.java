package com.budgetwise.service;

import com.budgetwise.dto.AuthResponse;
import com.budgetwise.dto.LoginRequest;
import com.budgetwise.dto.UserRegistrationRequest;
import com.budgetwise.model.Role;
import com.budgetwise.model.User;
import com.budgetwise.repository.UserRepository;
import com.budgetwise.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().toString());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().toString())
                .build();
    }

    public AuthResponse register(UserRegistrationRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .income(request.getIncome())
                .savingsGoal(request.getSavingsGoal())
                .targetExpenses(request.getTargetExpenses())
                .role(Role.ROLE_USER)
                .enabled(true)
                .build();

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().toString());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().toString())
                .build();
    }

    public void createAdminUser() {
        if (userRepository.findByEmail("admin@budgetwise.com").isEmpty()) {
            User admin = User.builder()
                    .email("admin@budgetwise.com")
                    .password(passwordEncoder.encode("admin123"))
                    .firstName("Admin")
                    .lastName("User")
                    .income(12000.0)
                    .savingsGoal(5000.0)
                    .targetExpenses(4000.0)
                    .role(Role.ROLE_ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
        }

        if (userRepository.findByEmail("user@budgetwise.com").isEmpty()) {
            User normalUser = User.builder()
                    .email("user@budgetwise.com")
                    .password(passwordEncoder.encode("user123"))
                    .firstName("John")
                    .lastName("Doe")
                    .income(5000.0)
                    .savingsGoal(2000.0)
                    .targetExpenses(3000.0)
                    .role(Role.ROLE_USER)
                    .enabled(true)
                    .build();
            userRepository.save(normalUser);
        }
    }
}

