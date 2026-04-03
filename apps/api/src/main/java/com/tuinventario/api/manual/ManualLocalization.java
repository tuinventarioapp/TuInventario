package com.tuinventario.api.manual;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

final class ManualLocalization {

    private final String language;

    private ManualLocalization(String language) {
        this.language = language;
    }

    static ManualLocalization from(Locale locale) {
        if (locale == null) {
            return new ManualLocalization("es");
        }
        return switch (locale.getLanguage()) {
            case "en" -> new ManualLocalization("en");
            case "pt" -> new ManualLocalization("pt");
            default -> new ManualLocalization("es");
        };
    }

    boolean isEnglish() {
        return "en".equals(language);
    }

    boolean isPortuguese() {
        return "pt".equals(language);
    }

    String fileName(String role) {
        return switch (language) {
            case "en" -> "user-manual-" + role.toLowerCase(Locale.ROOT) + ".pdf";
            case "pt" -> "manual-usuario-" + role.toLowerCase(Locale.ROOT) + ".pdf";
            default -> "manual-uso-" + role.toLowerCase(Locale.ROOT) + ".pdf";
        };
    }

    String title() {
        return switch (language) {
            case "en" -> "TuInventario user manual";
            case "pt" -> "Manual do usuario TuInventario";
            default -> "Manual de uso TuInventario";
        };
    }

    String subtitle(String roleLabel) {
        return switch (language) {
            case "en" -> "Guide tailored to the " + roleLabel + " role";
            case "pt" -> "Guia ajustado ao papel " + roleLabel;
            default -> "Guia ajustada al rol " + roleLabel;
        };
    }

    String intro() {
        return switch (language) {
            case "en" -> "This manual is generated with your current permissions and only includes the capabilities available in your profile.";
            case "pt" -> "Este manual e gerado com suas permissoes atuais e inclui apenas as capacidades disponiveis no seu perfil.";
            default -> "Este manual se genera con tus permisos actuales y solo incluye las capacidades disponibles en tu perfil.";
        };
    }

    String roleLabel() {
        return switch (language) {
            case "en" -> "Role";
            case "pt" -> "Papel";
            default -> "Rol";
        };
    }

    String organizationLabel() {
        return switch (language) {
            case "en" -> "Organization";
            case "pt" -> "Organizacao";
            default -> "Organizacion";
        };
    }

    String scopeLabel() {
        return switch (language) {
            case "en" -> "Scope";
            case "pt" -> "Escopo";
            default -> "Alcance";
        };
    }

    String generatedForLabel() {
        return switch (language) {
            case "en" -> "Generated for";
            case "pt" -> "Gerado para";
            default -> "Generado para";
        };
    }

    String generatedAtLabel() {
        return switch (language) {
            case "en" -> "Generated at";
            case "pt" -> "Gerado em";
            default -> "Generado el";
        };
    }

    String wholeOrganization() {
        return switch (language) {
            case "en" -> "Entire organization";
            case "pt" -> "Toda a organizacao";
            default -> "Toda la organizacion";
        };
    }

    String sectionScopeTitle() {
        return switch (language) {
            case "en" -> "Your scope";
            case "pt" -> "Seu alcance";
            default -> "Tu alcance";
        };
    }

    String sectionOperationsTitle() {
        return switch (language) {
            case "en" -> "Daily operations";
            case "pt" -> "Operacao diaria";
            default -> "Operacion diaria";
        };
    }

    String sectionControlTitle() {
        return switch (language) {
            case "en" -> "Control and follow-up";
            case "pt" -> "Controle e acompanhamento";
            default -> "Control y seguimiento";
        };
    }

    String sectionTipsTitle() {
        return switch (language) {
            case "en" -> "Quick reminders";
            case "pt" -> "Lembretes rapidos";
            default -> "Recordatorios rapidos";
        };
    }

    String roleName(String role) {
        return switch (language) {
            case "en" -> switch (role) {
                case "ADMIN" -> "Administrator";
                case "MANAGER" -> "Manager";
                case "COLLABORATOR" -> "Collaborator";
                case "BORROWER" -> "Borrower";
                default -> role;
            };
            case "pt" -> switch (role) {
                case "ADMIN" -> "Administrador";
                case "MANAGER" -> "Gestor";
                case "COLLABORATOR" -> "Colaborador";
                case "BORROWER" -> "Tomador";
                default -> role;
            };
            default -> switch (role) {
                case "ADMIN" -> "Administrador";
                case "MANAGER" -> "Gestor";
                case "COLLABORATOR" -> "Colaborador";
                case "BORROWER" -> "Prestatario";
                default -> role;
            };
        };
    }

    String formatInstant(Instant instant, String timezone) {
        return DateTimeFormatter.ofPattern(dateTimePattern(), locale())
                .withZone(ZoneId.of(timezone))
                .format(instant);
    }

    private String dateTimePattern() {
        return switch (language) {
            case "en" -> "MM/dd/yyyy hh:mm a";
            default -> "dd/MM/yyyy HH:mm";
        };
    }

    private Locale locale() {
        return switch (language) {
            case "en" -> Locale.ENGLISH;
            case "pt" -> Locale.forLanguageTag("pt");
            default -> Locale.forLanguageTag("es");
        };
    }
}
