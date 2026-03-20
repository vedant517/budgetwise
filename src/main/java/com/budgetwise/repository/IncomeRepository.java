package com.budgetwise.repository;

import com.budgetwise.model.Income;
import com.budgetwise.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncomeRepository extends MongoRepository<Income, String> {
    List<Income> findByUser(User user);
}
