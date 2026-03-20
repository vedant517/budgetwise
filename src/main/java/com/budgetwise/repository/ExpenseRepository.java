package com.budgetwise.repository;

import com.budgetwise.model.Expense;
import com.budgetwise.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepository extends MongoRepository<Expense, String> {
    List<Expense> findByUser(User user);
    List<Expense> findByUserAndCategory(User user, String category);
}
