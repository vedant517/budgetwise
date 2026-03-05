package com.budgetwise.service;

import com.budgetwise.model.User;
import com.budgetwise.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User updateUserProfile(String email, Double income, Double savingsGoal, Double targetExpenses) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setIncome(income);
        user.setSavingsGoal(savingsGoal);
        user.setTargetExpenses(targetExpenses);

        return userRepository.save(user);
    }
}
