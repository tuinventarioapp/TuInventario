package com.tuinventario.api.shared.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class RealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimePublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(UUID organizationId, String type, Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/organizations/" + organizationId, Map.of(
                "type", type,
                "organizationId", organizationId,
                "occurredAt", Instant.now().toString(),
                "payload", payload
        ));
    }
}
