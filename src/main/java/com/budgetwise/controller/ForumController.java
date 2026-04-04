package com.budgetwise.controller;

import com.budgetwise.model.Comment;
import com.budgetwise.model.ForumPost;
import com.budgetwise.model.User;
import com.budgetwise.repository.UserRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forum")
public class ForumController {

    private final MongoTemplate mongoTemplate;
    private final UserRepository userRepository;

    public ForumController(MongoTemplate mongoTemplate, UserRepository userRepository) {
        this.mongoTemplate = mongoTemplate;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<ForumPost>> getAllPosts() {
        return ResponseEntity.ok(mongoTemplate.findAll(ForumPost.class));
    }

    @PostMapping
    public ResponseEntity<ForumPost> createPost(@RequestBody ForumPost post) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User author = userRepository.findByEmail(email).orElseThrow();
        
        post.setAuthor(author);
        return ResponseEntity.ok(mongoTemplate.save(post));
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<ForumPost> likePost(@PathVariable String postId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ForumPost post = mongoTemplate.findById(postId, ForumPost.class);
        
        if (post != null) {
            if (post.getLikedBy().contains(email)) {
                post.getLikedBy().remove(email);
            } else {
                post.getLikedBy().add(email);
            }
            mongoTemplate.save(post);
        }
        return ResponseEntity.ok(post);
    }

    @PostMapping("/{postId}/comment")
    public ResponseEntity<ForumPost> addComment(@PathVariable String postId, @RequestBody String content) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        ForumPost post = mongoTemplate.findById(postId, ForumPost.class);
        
        if (post != null) {
            Comment comment = Comment.builder()
                    .content(content)
                    .authorName(user.getFirstName() + " " + user.getLastName())
                    .authorEmail(email)
                    .build();
            post.getComments().add(comment);
            mongoTemplate.save(post);
        }
        return ResponseEntity.ok(post);
    }
}
