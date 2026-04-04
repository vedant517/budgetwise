package com.budgetwise.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "forum_posts")
public class ForumPost {
    @Id
    private String id;
    private String title;
    private String content;
    private String category; // e.g., BUDGETING, INVESTING
    
    @DBRef
    private User author;
    
    @Builder.Default
    private List<String> likedBy = new ArrayList<>(); // User emails
    
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public int getLikeCount() {
        return likedBy.size();
    }
}
