package com.tuinventario.api.manual;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.tuinventario.api.domain.entity.OrganizationEntity;
import com.tuinventario.api.domain.entity.UserEntity;
import com.tuinventario.api.shared.exception.ApiException;
import com.tuinventario.api.shared.security.CurrentUser;
import com.tuinventario.api.shared.service.CurrentContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserManualService {

    private static final Color BRAND_PRIMARY = new Color(27, 125, 167);
    private static final Color BRAND_SURFACE = new Color(237, 246, 249);
    private static final Color BRAND_BORDER = new Color(198, 220, 228);
    private static final Color BRAND_INK = new Color(15, 23, 42);
    private static final Color BRAND_MUTED = new Color(86, 104, 121);

    private final CurrentContextService currentContextService;

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> download(Locale locale) {
        CurrentUser currentUser = currentContextService.currentUser();
        UserEntity actor = currentContextService.currentActorEntity();
        OrganizationEntity organization = currentContextService.currentOrganizationEntity();
        ManualLocalization texts = ManualLocalization.from(locale);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 28, 28, 30, 30);
            PdfWriter writer = PdfWriter.getInstance(document, outputStream);
            writer.setCompressionLevel(0);
            document.open();

            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, BRAND_PRIMARY);
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BRAND_INK);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BRAND_MUTED);
            Font metaLabelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, BRAND_MUTED);
            Font metaValueFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BRAND_INK);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, BRAND_INK);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BRAND_INK);

            PdfPTable header = new PdfPTable(new float[]{2.2f, 1f});
            header.setWidthPercentage(100f);
            header.setSpacingAfter(12f);

            PdfPCell brandCell = new PdfPCell();
            brandCell.setBorder(PdfPCell.NO_BORDER);
            Image logo = loadReportLogo();
            if (logo != null) {
                brandCell.addElement(logo);
            } else {
                brandCell.addElement(new Paragraph("TuInventario", brandFont));
            }
            header.addCell(brandCell);

            PdfPCell metaCell = new PdfPCell();
            metaCell.setBorder(PdfPCell.NO_BORDER);
            metaCell.setHorizontalAlignment(PdfPCell.ALIGN_RIGHT);
            metaCell.addElement(rightAlignedParagraph(texts.title(), subtitleFont));
            metaCell.addElement(rightAlignedParagraph(texts.generatedForLabel() + ": " + actor.getFullName(), subtitleFont));
            metaCell.addElement(rightAlignedParagraph(texts.generatedAtLabel() + ": " + texts.formatInstant(Instant.now(), organization.getTimezone()), subtitleFont));
            header.addCell(metaCell);
            document.add(header);

            document.add(new Paragraph(texts.title(), titleFont));
            Paragraph subtitle = new Paragraph(texts.subtitle(texts.roleName(currentUser.role())), subtitleFont);
            subtitle.setSpacingAfter(10f);
            document.add(subtitle);

            Paragraph intro = new Paragraph(texts.intro(), bodyFont);
            intro.setSpacingAfter(12f);
            document.add(intro);

            PdfPTable metadata = new PdfPTable(new float[]{1.2f, 2.8f});
            metadata.setWidthPercentage(100f);
            metadata.setSpacingAfter(14f);
            metadata.addCell(metaLabelCell(texts.roleLabel(), metaLabelFont));
            metadata.addCell(metaValueCell(texts.roleName(currentUser.role()), metaValueFont));
            metadata.addCell(metaLabelCell(texts.organizationLabel(), metaLabelFont));
            metadata.addCell(metaValueCell(organization.getName(), metaValueFont));
            metadata.addCell(metaLabelCell(texts.scopeLabel(), metaLabelFont));
            metadata.addCell(metaValueCell(currentUser.assignedLocationName() == null ? texts.wholeOrganization() : currentUser.assignedLocationName(), metaValueFont));
            document.add(metadata);

            for (ManualSection section : sectionsFor(currentUser, texts)) {
                Paragraph sectionTitle = new Paragraph(section.title(), sectionFont);
                sectionTitle.setSpacingBefore(6f);
                sectionTitle.setSpacingAfter(6f);
                document.add(sectionTitle);
                for (String bullet : section.bullets()) {
                    Paragraph paragraph = new Paragraph("- " + bullet, bodyFont);
                    paragraph.setIndentationLeft(12f);
                    paragraph.setSpacingAfter(4f);
                    document.add(paragraph);
                }
            }

            document.close();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + texts.fileName(currentUser.role()))
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(outputStream.toByteArray());
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "MANUAL_GENERATION_ERROR", "No fue posible generar el manual actual.");
        }
    }

    private List<ManualSection> sectionsFor(CurrentUser user, ManualLocalization texts) {
        List<ManualSection> sections = new ArrayList<>();
        switch (user.role()) {
            case "ADMIN" -> {
                sections.add(new ManualSection(texts.sectionScopeTitle(), List.of(
                        localized(texts, "Puedes operar toda la organización o filtrar por sede según la tarea.", "You can operate across the whole organization or filter by location for each task.", "Voce pode operar toda a organizacao ou filtrar por local conforme a tarefa."),
                        localized(texts, "Configuras catálogos globales, ubicaciones, usuarios internos y cuentas de prestatario.", "You configure global catalogs, locations, internal users, and borrower accounts.", "Voce configura catalogos globais, locais, usuarios internos e contas de tomadores."),
                        localized(texts, "El manual que descargan otros roles no incluye estas capacidades administrativas.", "Manuals downloaded by other roles do not include these administrative capabilities.", "Os manuais baixados por outros papeis nao incluem estas capacidades administrativas.")
                )));
                sections.add(new ManualSection(texts.sectionOperationsTitle(), List.of(
                        localized(texts, "En Inventario puedes crear, editar, archivar o eliminar artículos y hacer carga masiva por Excel usando SKU como referencia.", "In Inventory you can create, edit, archive, or delete items and run bulk Excel imports using SKU as the reference.", "No Inventario voce pode criar, editar, arquivar ou excluir itens e fazer carga em massa por Excel usando SKU como referencia."),
                        localized(texts, "En Movimientos registras entradas, salidas, ajustes y traslados entre sedes.", "In Movements you register entries, exits, adjustments, and transfers between locations.", "Em Movimentos voce registra entradas, saidas, ajustes e transferencias entre locais."),
                        localized(texts, "En Préstamos revisas solicitudes internas y solicitudes agrupadas de prestatarios con aprobación parcial por artículo.", "In Loans you review internal requests and grouped borrower requests with per-item partial approval.", "Em Emprestimos voce revisa solicitacoes internas e solicitacoes agrupadas de tomadores com aprovacao parcial por item.")
                )));
                sections.add(new ManualSection(texts.sectionControlTitle(), List.of(
                        localized(texts, "Puedes entregar préstamos, registrar devoluciones parciales por artículo y dejar notas administrativas.", "You can deliver loans, register partial returns by item, and keep administrative notes.", "Voce pode entregar emprestimos, registrar devolucoes parciais por item e deixar notas administrativas."),
                        localized(texts, "Descargas reportes operativos o administrativos y puedes revisar auditoría global.", "You can download operational or administrative reports and review global audit trails.", "Voce pode baixar relatorios operacionais ou administrativos e revisar a auditoria global."),
                        localized(texts, "Desde Configuración validas idioma, organización y tu alcance actual.", "From Settings you can verify language, organization, and current scope.", "Em Configuracao voce valida idioma, organizacao e seu alcance atual.")
                )));
            }
            case "MANAGER" -> {
                sections.add(new ManualSection(texts.sectionScopeTitle(), List.of(
                        localized(texts, "Operas únicamente sobre tu sede asignada; no gestionas catálogos globales ni usuarios internos.", "You operate only within your assigned location; you do not manage global catalogs or internal users.", "Voce opera apenas em seu local atribuido; nao gerencia catalogos globais nem usuarios internos."),
                        localized(texts, "Las cuentas de prestatario, artículos, movimientos y préstamos que ves quedan limitados a esa sede.", "Borrower accounts, items, movements, and loans are limited to that location.", "As contas de tomador, itens, movimentos e emprestimos que voce ve ficam limitados a esse local.")
                )));
                sections.add(new ManualSection(texts.sectionOperationsTitle(), List.of(
                        localized(texts, "En Inventario puedes crear, editar, eliminar y cargar artículos en masa solo para tu sede.", "In Inventory you can create, edit, delete, and bulk import items only for your location.", "No Inventario voce pode criar, editar, excluir e importar itens em massa apenas para o seu local."),
                        localized(texts, "En Movimientos registras entradas, salidas y ajustes de tu sede.", "In Movements you register entries, exits, and adjustments for your location.", "Em Movimentos voce registra entradas, saidas e ajustes do seu local."),
                        localized(texts, "En Prestatarios gestionas fichas y cuentas con acceso para solicitar artículos de tu sede.", "In Borrowers you manage profiles and accounts with access to request items from your location.", "Em Tomadores voce gerencia fichas e contas com acesso para solicitar itens do seu local.")
                )));
                sections.add(new ManualSection(texts.sectionControlTitle(), List.of(
                        localized(texts, "En Préstamos revisas solicitudes, apruebas o rechazas por artículo, entregas y registras devoluciones parciales con notas.", "In Loans you review requests, approve or reject by item, deliver, and register partial returns with notes.", "Em Emprestimos voce revisa solicitacoes, aprova ou rejeita por item, entrega e registra devolucoes parciais com notas."),
                        localized(texts, "Puedes descargar reportes de tu sede y revisar auditoría filtrada por tu alcance operativo.", "You can download reports for your location and review audit entries filtered by your operational scope.", "Voce pode baixar relatorios do seu local e revisar a auditoria filtrada pelo seu alcance operacional."),
                        localized(texts, "Usa Configuración para validar idioma, rol y sede actual.", "Use Settings to verify language, role, and current location.", "Use Configuracao para validar idioma, papel e local atual.")
                )));
            }
            case "COLLABORATOR" -> {
                sections.add(new ManualSection(texts.sectionScopeTitle(), List.of(
                        localized(texts, "Tu trabajo está limitado a la sede asignada y a la operación diaria permitida para tu perfil.", "Your work is limited to your assigned location and the daily operations allowed for your profile.", "Seu trabalho fica limitado ao local atribuido e a operacao diaria permitida para seu perfil."),
                        localized(texts, "No administras catálogos, usuarios, auditoría ni aprobación de préstamos.", "You do not manage catalogs, users, audit trails, or loan approvals.", "Voce nao gerencia catalogos, usuarios, auditoria nem aprovacao de emprestimos.")
                )));
                sections.add(new ManualSection(texts.sectionOperationsTitle(), List.of(
                        localized(texts, "En Panel e Inventario consultas el estado operativo, los filtros y el stock disponible de tu sede.", "In Dashboard and Inventory you review the operational state, filters, and available stock for your location.", "No Painel e Inventario voce consulta o estado operacional, filtros e estoque disponivel do seu local."),
                        localized(texts, "En Movimientos revisas el historial operativo y sus filtros por artículo, cantidad o fechas.", "In Movements you review operational history and filter by item, quantity, or date.", "Em Movimentos voce revisa o historico operacional e filtra por item, quantidade ou datas."),
                        localized(texts, "En Préstamos creas solicitudes internas y sigues su estado hasta la devolución.", "In Loans you create internal requests and follow their status until return.", "Em Emprestimos voce cria solicitacoes internas e acompanha o status ate a devolucao.")
                )));
                sections.add(new ManualSection(texts.sectionTipsTitle(), List.of(
                        localized(texts, "Si no ves un registro, revisa filtros, rango de fechas o la sede asignada.", "If you cannot see a record, check filters, date range, or your assigned location.", "Se nao encontrar um registro, revise filtros, periodo ou o local atribuido."),
                        localized(texts, "Puedes descargar reportes operativos de tu sede y cambiar idioma desde Configuración.", "You can download operational reports for your location and change language from Settings.", "Voce pode baixar relatorios operacionais do seu local e mudar o idioma em Configuracao.")
                )));
            }
            case "BORROWER" -> {
                sections.add(new ManualSection(texts.sectionScopeTitle(), List.of(
                        localized(texts, "Solo ves el inventario disponible de la sede que te asignó la organización.", "You only see the available inventory from the location assigned to you by the organization.", "Voce so ve o inventario disponivel do local atribuido pela organizacao."),
                        localized(texts, "Tu perfil está orientado a solicitar artículos y hacer seguimiento a tus propios préstamos.", "Your profile is focused on requesting items and tracking your own loans.", "Seu perfil e voltado para solicitar itens e acompanhar seus proprios emprestimos.")
                )));
                sections.add(new ManualSection(texts.sectionOperationsTitle(), List.of(
                        localized(texts, "En Inventario puedes filtrar artículos, añadir varios al carrito y enviar una sola solicitud agrupada.", "In Inventory you can filter items, add several to the cart, and submit a single grouped request.", "No Inventario voce pode filtrar itens, adicionar varios ao carrinho e enviar uma unica solicitacao agrupada."),
                        localized(texts, "Cada solicitud conserva una sola fecha límite y puede ser aprobada parcialmente por artículo.", "Each request keeps one due date and can be partially approved by item.", "Cada solicitacao mantem uma unica data limite e pode ser aprovada parcialmente por item."),
                        localized(texts, "En Préstamos ves solicitudes pendientes, préstamos activos, historial y alertas cuando un vencimiento se acerca.", "In Loans you see pending requests, active loans, history, and alerts when a due date is near.", "Em Emprestimos voce ve solicitacoes pendentes, emprestimos ativos, historico e alertas quando o vencimento se aproxima.")
                )));
                sections.add(new ManualSection(texts.sectionTipsTitle(), List.of(
                        localized(texts, "Si una línea fue rechazada o reducida, revisa la cantidad aprobada y el motivo registrado por el gestor o administrador.", "If a line was rejected or reduced, review the approved quantity and the reason recorded by the manager or administrator.", "Se uma linha foi rejeitada ou reduzida, revise a quantidade aprovada e o motivo registrado pelo gestor ou administrador."),
                        localized(texts, "Configuración te permite validar idioma y datos básicos de tu cuenta.", "Settings lets you verify language and basic account information.", "Configuracao permite validar idioma e dados basicos da sua conta.")
                )));
            }
            default -> sections.add(new ManualSection(texts.sectionScopeTitle(), List.of(
                    localized(texts, "No hay una guía específica para este rol.", "There is no specific guide for this role.", "Nao ha um guia especifico para este papel.")
            )));
        }
        return sections;
    }

    private String localized(ManualLocalization texts, String es, String en, String pt) {
        if (texts.isEnglish()) {
            return en;
        }
        if (texts.isPortuguese()) {
            return pt;
        }
        return es;
    }

    private Paragraph rightAlignedParagraph(String value, Font font) {
        Paragraph paragraph = new Paragraph(value, font);
        paragraph.setAlignment(Paragraph.ALIGN_RIGHT);
        paragraph.setSpacingAfter(4f);
        return paragraph;
    }

    private PdfPCell metaLabelCell(String value, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font));
        cell.setBorderColor(BRAND_BORDER);
        cell.setBackgroundColor(BRAND_SURFACE);
        cell.setPadding(6f);
        return cell;
    }

    private PdfPCell metaValueCell(String value, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font));
        cell.setBorderColor(BRAND_BORDER);
        cell.setPadding(6f);
        return cell;
    }

    private Image loadReportLogo() {
        try {
            ClassPathResource resource = new ClassPathResource("branding/tuinventario-logo-horizontal.png");
            if (!resource.exists()) {
                return null;
            }
            Image image = Image.getInstance(resource.getInputStream().readAllBytes());
            image.scaleToFit(210f, 50f);
            return image;
        } catch (Exception ignored) {
            return null;
        }
    }

    private record ManualSection(String title, List<String> bullets) {
    }
}
