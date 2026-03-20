package com.budgetwise.repository;

import com.budgetwise.model.SavingsGoal;
import com.budgetwise.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface SavingsGoalRepository extends MongoRepository<SavingsGoal, String> {
    List<SavingsGoal> findByUser(User user);
}
