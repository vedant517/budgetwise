package com.budgetwise;

import com.budgetwise.service.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class BudgetWiseApplication {

    public static void main(String[] args) {
        SpringApplication.run(BudgetWiseApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(AuthService authService) {
        return args -> {
            authService.createAdminUser();
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
