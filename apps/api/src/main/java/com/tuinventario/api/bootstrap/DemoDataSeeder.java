package com.tuinventario.api.bootstrap;

import com.tuinventario.api.domain.entity.BorrowerEntity;
import com.tuinventario.api.domain.entity.CategoryEntity;
import com.tuinventario.api.domain.entity.ItemEntity;
import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.entity.MembershipEntity;
import com.tuinventario.api.domain.entity.OrganizationEntity;
import com.tuinventario.api.domain.entity.RoleEntity;
import com.tuinventario.api.domain.entity.UnitEntity;
import com.tuinventario.api.domain.entity.UserEntity;
import com.tuinventario.api.domain.enums.EntityStatus;
import com.tuinventario.api.domain.enums.ItemStatus;
import com.tuinventario.api.domain.enums.ItemType;
import com.tuinventario.api.domain.enums.LocationType;
import com.tuinventario.api.domain.enums.MembershipStatus;
import com.tuinventario.api.domain.repository.BorrowerRepository;
import com.tuinventario.api.domain.repository.CategoryRepository;
import com.tuinventario.api.domain.repository.ItemRepository;
import com.tuinventario.api.domain.repository.LocationRepository;
import com.tuinventario.api.domain.repository.MembershipRepository;
import com.tuinventario.api.domain.repository.OrganizationRepository;
import com.tuinventario.api.domain.repository.RoleRepository;
import com.tuinventario.api.domain.repository.UnitRepository;
import com.tuinventario.api.domain.repository.UserRepository;
import com.tuinventario.api.shared.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DemoDataSeeder implements ApplicationRunner {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final MembershipRepository membershipRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final LocationRepository locationRepository;
    private final ItemRepository itemRepository;
    private final BorrowerRepository borrowerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (organizationRepository.findBySlug("tuinventario-demo").isPresent()) {
            return;
        }

        OrganizationEntity organization = new OrganizationEntity();
        organization.setName("TuInventario Demo");
        organization.setSlug(SlugUtils.slugify("TuInventario Demo"));
        organization.setTimezone("America/Bogota");
        organization.setStatus(EntityStatus.ACTIVE);
        organizationRepository.save(organization);

        RoleEntity adminRole = roleRepository.findByName("ADMIN").orElseThrow();
        RoleEntity managerRole = roleRepository.findByName("MANAGER").orElseThrow();

        UserEntity admin = new UserEntity();
        admin.setEmail("demo@tuinventario.local");
        admin.setFullName("Admin Demo");
        admin.setPasswordHash(passwordEncoder.encode("Demo12345!"));
        admin.setStatus(EntityStatus.ACTIVE);
        admin.setEmailVerified(true);
        userRepository.save(admin);

        UserEntity manager = new UserEntity();
        manager.setEmail("gestor@tuinventario.local");
        manager.setFullName("Gestor Demo");
        manager.setPasswordHash(passwordEncoder.encode("Gestor12345!"));
        manager.setStatus(EntityStatus.ACTIVE);
        manager.setEmailVerified(true);
        userRepository.save(manager);

        MembershipEntity adminMembership = new MembershipEntity();
        adminMembership.setOrganization(organization);
        adminMembership.setUser(admin);
        adminMembership.setRole(adminRole);
        adminMembership.setStatus(MembershipStatus.ACTIVE);
        membershipRepository.save(adminMembership);

        MembershipEntity managerMembership = new MembershipEntity();
        managerMembership.setOrganization(organization);
        managerMembership.setUser(manager);
        managerMembership.setRole(managerRole);
        managerMembership.setStatus(MembershipStatus.ACTIVE);
        membershipRepository.save(managerMembership);

        CategoryEntity category = new CategoryEntity();
        category.setOrganization(organization);
        category.setName("Herramientas");
        category.setDescription("Herramientas y equipos");
        categoryRepository.save(category);

        UnitEntity unit = new UnitEntity();
        unit.setOrganization(organization);
        unit.setName("Unidad");
        unit.setSymbol("und");
        unit.setAllowsDecimal(false);
        unitRepository.save(unit);

        LocationEntity location = new LocationEntity();
        location.setOrganization(organization);
        location.setName("Bodega Principal");
        location.setType(LocationType.WAREHOUSE);
        location.setDescription("Ubicacion principal demo");
        locationRepository.save(location);

        ItemEntity item = new ItemEntity();
        item.setOrganization(organization);
        item.setCategory(category);
        item.setUnit(unit);
        item.setPrimaryLocation(location);
        item.setName("Taladro Inalambrico");
        item.setSku("TAL-001");
        item.setDescription("Taladro demo listo para prestamos.");
        item.setType(ItemType.LENDABLE);
        item.setStatus(ItemStatus.AVAILABLE);
        item.setConsumable(false);
        item.setLendable(true);
        item.setTotalStock(new BigDecimal("4"));
        item.setAvailableStock(new BigDecimal("4"));
        item.setReservedStock(BigDecimal.ZERO);
        item.setLoanedStock(BigDecimal.ZERO);
        item.setDamagedStock(BigDecimal.ZERO);
        itemRepository.save(item);

        BorrowerEntity borrower = new BorrowerEntity();
        borrower.setOrganization(organization);
        borrower.setName("Cliente Demo");
        borrower.setEmail("cliente.demo@correo.local");
        borrower.setPhone("3000000000");
        borrower.setNotes("Prestatario de demostracion");
        borrowerRepository.save(borrower);
    }
}
