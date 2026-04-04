package com.budgetwise.config;

import com.budgetwise.model.ForumPost;
import com.budgetwise.model.User;
import com.budgetwise.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.Collections;

@Configuration
public class DataSeederConfig {

    @Bean
    CommandLineRunner initForum(MongoTemplate mongoTemplate, UserRepository userRepository) {
        return args -> {
            if (mongoTemplate.findAll(ForumPost.class).isEmpty()) {
                User admin = userRepository.findByEmail("admin@budgetwise.com").orElse(null);
                
                ForumPost post1 = ForumPost.builder()
                        .title("5 Simple Budgeting Tips That Changed My Life")
                        .content("After struggling with finances for years, I discovered these 5 golden rules: 1) Track every expense, no matter how small. 2) Use the 50/30/20 rule for income allocation. 3) Set up automatic transfers to savings. 4) Review your budget weekly. 5) Use cash for discretionary spending to feel the money leaving your hands!")
                        .category("BUDGETING")
                        .author(admin)
                        .likedBy(Collections.singletonList("user@example.com"))
                        .build();

                ForumPost post2 = ForumPost.builder()
                        .title("Best Index Funds for Beginners in 2026")
                        .content("If you are new to investing, start with low-cost index funds. I recommend looking at Nifty 50 index funds which have averaged 12-15% returns over the last decade. Start with a SIP of even ₹500/month — consistency matters more than amount. Always check the expense ratio before investing.")
                        .category("INVESTING")
                        .author(admin)
                        .likedBy(Collections.singletonList("user2@example.com"))
                        .build();

                mongoTemplate.save(post1);
                mongoTemplate.save(post2);
            }
        };
    }
}
