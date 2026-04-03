package com.tuinventario.api.manual;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/manual")
@RequiredArgsConstructor
public class ManualController {

    private final UserManualService userManualService;

    @GetMapping(value = "/user.pdf", produces = "application/pdf")
    public ResponseEntity<byte[]> userManual(Locale locale) {
        return userManualService.download(locale);
    }
}
