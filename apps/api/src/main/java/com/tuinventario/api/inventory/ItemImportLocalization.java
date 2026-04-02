package com.tuinventario.api.inventory;

import com.tuinventario.api.domain.enums.ItemStatus;
import com.tuinventario.api.domain.enums.ItemType;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class ItemImportLocalization {

    private final String language;

    private ItemImportLocalization(String language) {
        this.language = language;
    }

    public static ItemImportLocalization from(Locale locale) {
        if (locale == null) {
            return new ItemImportLocalization("es");
        }
        return switch (locale.getLanguage()) {
            case "en" -> new ItemImportLocalization("en");
            case "pt" -> new ItemImportLocalization("pt");
            default -> new ItemImportLocalization("es");
        };
    }

    public String templateTitle() {
        return switch (language) {
            case "en" -> "Bulk item import template";
            case "pt" -> "Modelo de carga em massa de artigos";
            default -> "Plantilla de carga masiva de articulos";
        };
    }

    public String howToUseTitle() {
        return switch (language) {
            case "en" -> "How to use this template";
            case "pt" -> "Como usar este modelo";
            default -> "Como usar esta plantilla";
        };
    }

    public String stepDownload() {
        return switch (language) {
            case "en" -> "1. Download this template and fill in the Articulos sheet.";
            case "pt" -> "1. Baixe este modelo e preencha a aba Articulos.";
            default -> "1. Descarga esta plantilla y llena la hoja Articulos.";
        };
    }

    public String stepOneRowPerItem() {
        return switch (language) {
            case "en" -> "2. Complete one row per item.";
            case "pt" -> "2. Complete uma linha por artigo.";
            default -> "2. Completa una fila por articulo.";
        };
    }

    public String stepSku() {
        return switch (language) {
            case "en" -> "3. The SKU is required and helps detect whether an item already exists.";
            case "pt" -> "3. O SKU e obrigatorio e ajuda a detectar se um artigo ja existe.";
            default -> "3. El campo SKU es obligatorio y ayuda a detectar si un articulo ya existe.";
        };
    }

    public String stepMatches() {
        return switch (language) {
            case "en" -> "4. If the SKU already exists, the platform will ask whether you want to update that item.";
            case "pt" -> "4. Se o SKU ja existir, a plataforma vai mostrar se voce quer atualizar esse artigo.";
            default -> "4. Si el SKU ya existe, la plataforma debera mostrarte si quieres actualizar ese articulo.";
        };
    }

    public String stepUpload() {
        return switch (language) {
            case "en" -> "5. When you finish, upload the same .xlsx file to TuInventario.";
            case "pt" -> "5. Quando terminar, envie o mesmo arquivo .xlsx para o TuInventario.";
            default -> "5. Cuando termines, sube el mismo archivo .xlsx a TuInventario.";
        };
    }

    public String requiredFieldsLabel() {
        return switch (language) {
            case "en" -> "Required fields";
            case "pt" -> "Campos obrigatorios";
            default -> "Campos obligatorios";
        };
    }

    public String optionalFieldsLabel() {
        return switch (language) {
            case "en" -> "Optional fields";
            case "pt" -> "Campos opcionais";
            default -> "Campos opcionales";
        };
    }

    public String validTypesLabel() {
        return switch (language) {
            case "en" -> "Valid values for tipo_articulo";
            case "pt" -> "Valores validos para tipo_articulo";
            default -> "Valores validos para tipo_articulo";
        };
    }

    public String validStatusLabel() {
        return switch (language) {
            case "en" -> "Valid values for estado";
            case "pt" -> "Valores validos para estado";
            default -> "Valores validos para estado";
        };
    }

    public String validCategoriesLabel() {
        return switch (language) {
            case "en" -> "Valid categories";
            case "pt" -> "Categorias validas";
            default -> "Categorias validas";
        };
    }

    public String validUnitsLabel() {
        return switch (language) {
            case "en" -> "Valid units";
            case "pt" -> "Unidades validas";
            default -> "Unidades validas";
        };
    }

    public String validLocationsLabel() {
        return switch (language) {
            case "en" -> "Valid locations";
            case "pt" -> "Locais validos";
            default -> "Ubicaciones validas";
        };
    }

    public String emptyCatalogValue() {
        return switch (language) {
            case "en" -> "No records available";
            case "pt" -> "Sem registros disponiveis";
            default -> "No hay registros disponibles";
        };
    }

    public String managerLocationHint(String locationName) {
        return switch (language) {
            case "en" -> "Leave ubicacion_principal empty and the system will use your assigned location: " + locationName;
            case "pt" -> "Deixe ubicacion_principal em branco e o sistema usara seu local atribuido: " + locationName;
            default -> "Deja ubicacion_principal vacio y el sistema usara tu ubicacion asignada: " + locationName;
        };
    }

    public String requiredFieldsValue(boolean admin) {
        if (admin) {
            return "sku, nombre, tipo_articulo, categoria, unidad, ubicacion_principal, stock_inicial, stock_minimo";
        }
        return "sku, nombre, tipo_articulo, categoria, unidad, stock_inicial, stock_minimo";
    }

    public String optionalFieldsValue(boolean admin) {
        if (admin) {
            return "estado, descripcion";
        }
        return switch (language) {
            case "en" -> "estado, descripcion, ubicacion_principal (optional for managers)";
            case "pt" -> "estado, descricao, ubicacion_principal (opcional para gestores)";
            default -> "estado, descripcion, ubicacion_principal (opcional para gestores)";
        };
    }

    public List<String> localizedItemTypes() {
        return List.of(label(ItemType.CONSUMABLE), label(ItemType.LENDABLE), label(ItemType.HYBRID));
    }

    public List<String> localizedStatuses() {
        return List.of(
                label(ItemStatus.AVAILABLE),
                label(ItemStatus.RESERVED),
                label(ItemStatus.ON_LOAN),
                label(ItemStatus.MAINTENANCE),
                label(ItemStatus.LOST),
                label(ItemStatus.ARCHIVED)
        );
    }

    public String label(ItemType type) {
        return switch (type) {
            case CONSUMABLE -> switch (language) {
                case "en" -> "Consumable";
                case "pt" -> "Consumivel";
                default -> "Consumible";
            };
            case LENDABLE -> switch (language) {
                case "en" -> "Lendable";
                case "pt" -> "Emprestavel";
                default -> "Prestable";
            };
            case HYBRID -> switch (language) {
                case "en" -> "Hybrid";
                case "pt" -> "Hibrido";
                default -> "Hibrido";
            };
            case NON_LENDABLE -> switch (language) {
                case "en" -> "Non lendable";
                case "pt" -> "Nao emprestavel";
                default -> "No prestable";
            };
        };
    }

    public String label(ItemStatus status) {
        return switch (status) {
            case AVAILABLE -> switch (language) {
                case "en" -> "Available";
                case "pt" -> "Disponivel";
                default -> "Disponible";
            };
            case RESERVED -> switch (language) {
                case "en" -> "Reserved";
                case "pt" -> "Reservado";
                default -> "Reservado";
            };
            case ON_LOAN -> switch (language) {
                case "en" -> "On loan";
                case "pt" -> "Emprestado";
                default -> "En prestamo";
            };
            case MAINTENANCE -> switch (language) {
                case "en" -> "Maintenance";
                case "pt" -> "Manutencao";
                default -> "Mantenimiento";
            };
            case LOST -> switch (language) {
                case "en" -> "Lost";
                case "pt" -> "Perdido";
                default -> "Perdido";
            };
            case ARCHIVED -> switch (language) {
                case "en" -> "Archived";
                case "pt" -> "Arquivado";
                default -> "Archivado";
            };
        };
    }

    public static ItemType parseItemType(String rawValue) {
        String normalized = normalize(rawValue);
        if (normalized.isBlank()) {
            return null;
        }

        Map<String, ItemType> aliases = new LinkedHashMap<>();
        aliases.put("CONSUMABLE", ItemType.CONSUMABLE);
        aliases.put("consumable", ItemType.CONSUMABLE);
        aliases.put("consumible", ItemType.CONSUMABLE);
        aliases.put("consumivel", ItemType.CONSUMABLE);
        aliases.put("LENDABLE", ItemType.LENDABLE);
        aliases.put("lendable", ItemType.LENDABLE);
        aliases.put("prestable", ItemType.LENDABLE);
        aliases.put("emprestavel", ItemType.LENDABLE);
        aliases.put("HYBRID", ItemType.HYBRID);
        aliases.put("hybrid", ItemType.HYBRID);
        aliases.put("hibrido", ItemType.HYBRID);

        return aliases.get(normalized);
    }

    public static ItemStatus parseItemStatus(String rawValue) {
        String normalized = normalize(rawValue);
        if (normalized.isBlank()) {
            return null;
        }

        Map<String, ItemStatus> aliases = new LinkedHashMap<>();
        aliases.put("AVAILABLE", ItemStatus.AVAILABLE);
        aliases.put("available", ItemStatus.AVAILABLE);
        aliases.put("disponible", ItemStatus.AVAILABLE);
        aliases.put("disponivel", ItemStatus.AVAILABLE);
        aliases.put("RESERVED", ItemStatus.RESERVED);
        aliases.put("reserved", ItemStatus.RESERVED);
        aliases.put("reservado", ItemStatus.RESERVED);
        aliases.put("ON_LOAN", ItemStatus.ON_LOAN);
        aliases.put("on loan", ItemStatus.ON_LOAN);
        aliases.put("en prestamo", ItemStatus.ON_LOAN);
        aliases.put("emprestado", ItemStatus.ON_LOAN);
        aliases.put("MAINTENANCE", ItemStatus.MAINTENANCE);
        aliases.put("maintenance", ItemStatus.MAINTENANCE);
        aliases.put("mantenimiento", ItemStatus.MAINTENANCE);
        aliases.put("manutencao", ItemStatus.MAINTENANCE);
        aliases.put("LOST", ItemStatus.LOST);
        aliases.put("lost", ItemStatus.LOST);
        aliases.put("perdido", ItemStatus.LOST);
        aliases.put("ARCHIVED", ItemStatus.ARCHIVED);
        aliases.put("archived", ItemStatus.ARCHIVED);
        aliases.put("archivado", ItemStatus.ARCHIVED);
        aliases.put("arquivado", ItemStatus.ARCHIVED);

        return aliases.get(normalized);
    }

    private static String normalize(String rawValue) {
        if (rawValue == null) {
            return "";
        }
        return Normalizer.normalize(rawValue.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('_', ' ')
                .toLowerCase(Locale.ROOT);
    }
}
