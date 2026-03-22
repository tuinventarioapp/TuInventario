package com.tuinventario.api.users;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserDtos.UserSummaryResponse> listUsers() {
        return userService.listUsers();
    }

    @PostMapping
    public UserDtos.UserSummaryResponse createUser(@Valid @RequestBody UserDtos.CreateUserRequest request) {
        return userService.createUser(request);
    }
}
