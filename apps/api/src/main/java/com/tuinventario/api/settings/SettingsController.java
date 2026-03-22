package com.tuinventario.api.settings;

import com.tuinventario.api.shared.service.CurrentContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final CurrentContextService currentContextService;

    @GetMapping
    public Map<String, Object> currentSettings() {
        var organization = currentContextService.currentOrganizationEntity();
        return Map.of(
                "organizationId", organization.getId().toString(),
                "organizationName", organization.getName(),
                "timezone", organization.getTimezone(),
                "role", currentContextService.currentUser().role(),
                "assignedLocationId", currentContextService.currentUser().assignedLocationId() == null ? "" : currentContextService.currentUser().assignedLocationId().toString(),
                "assignedLocationName", currentContextService.currentUser().assignedLocationName() == null ? "" : currentContextService.currentUser().assignedLocationName()
        );
    }
}
