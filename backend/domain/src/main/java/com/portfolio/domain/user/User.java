package com.portfolio.domain.user;

import com.portfolio.domain.common.SoftDeletableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends SoftDeletableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Builder
    public User(String email, String username, String password, UserRole role) {
        this.email = email;
        this.username = username;
        this.password = password;
        this.role = role != null ? role : UserRole.USER;
    }

    public void updatePassword(String newPassword) {
        this.password = newPassword;
    }

    public void updateRole(UserRole newRole) {
        this.role = newRole;
    }

    public boolean isAdmin() {
        return this.role == UserRole.ADMIN;
    }
}
