package com.tuinventario.api.bootstrap;

import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.entity.MembershipEntity;
import com.tuinventario.api.domain.entity.OrganizationEntity;
import com.tuinventario.api.domain.entity.RoleEntity;
import com.tuinventario.api.domain.entity.UserEntity;
import com.tuinventario.api.domain.enums.EntityStatus;
import com.tuinventario.api.domain.enums.LocationType;
import com.tuinventario.api.domain.enums.MembershipStatus;
import com.tuinventario.api.domain.repository.LocationRepository;
import com.tuinventario.api.domain.repository.MembershipRepository;
import com.tuinventario.api.domain.repository.OrganizationRepository;
import com.tuinventario.api.domain.repository.RoleRepository;
import com.tuinventario.api.domain.repository.UserRepository;
import com.tuinventario.api.shared.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DemoDataSeeder implements ApplicationRunner {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final MembershipRepository membershipRepository;
    private final LocationRepository locationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (organizationRepository.findBySlug("tuinventario").isPresent()) {
            return;
        }

        OrganizationEntity organization = new OrganizationEntity();
        organization.setName("TuInventario");
        organization.setSlug(SlugUtils.slugify("TuInventario"));
        organization.setTimezone("America/Bogota");
        organization.setStatus(EntityStatus.ACTIVE);
        organizationRepository.save(organization);

        RoleEntity adminRole = roleRepository.findByName("ADMIN").orElseThrow();
        RoleEntity managerRole = roleRepository.findByName("MANAGER").orElseThrow();
        RoleEntity collaboratorRole = roleRepository.findByName("COLLABORATOR").orElseThrow();

        LocationEntity location = new LocationEntity();
        location.setOrganization(organization);
        location.setName("Sede Principal");
        location.setType(LocationType.WAREHOUSE);
        location.setDescription("Sede base de la operacion");
        locationRepository.save(location);

        UserEntity admin = new UserEntity();
        admin.setEmail("admin@admin.com");
        admin.setFullName("Administrador");
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setStatus(EntityStatus.ACTIVE);
        admin.setEmailVerified(true);
        userRepository.save(admin);

        UserEntity collaborator = new UserEntity();
        collaborator.setEmail("colaborador@colaborador.com");
        collaborator.setFullName("Colaborador");
        collaborator.setPasswordHash(passwordEncoder.encode("colaborador123"));
        collaborator.setStatus(EntityStatus.ACTIVE);
        collaborator.setEmailVerified(true);
        userRepository.save(collaborator);

        UserEntity worker = new UserEntity();
        worker.setEmail("trabajador@trabajador.com");
        worker.setFullName("Trabajador");
        worker.setPasswordHash(passwordEncoder.encode("trabajador123"));
        worker.setStatus(EntityStatus.ACTIVE);
        worker.setEmailVerified(true);
        userRepository.save(worker);

        MembershipEntity adminMembership = new MembershipEntity();
        adminMembership.setOrganization(organization);
        adminMembership.setUser(admin);
        adminMembership.setRole(adminRole);
        adminMembership.setAssignedLocation(null);
        adminMembership.setStatus(MembershipStatus.ACTIVE);
        membershipRepository.save(adminMembership);

        MembershipEntity collaboratorMembership = new MembershipEntity();
        collaboratorMembership.setOrganization(organization);
        collaboratorMembership.setUser(collaborator);
        collaboratorMembership.setRole(collaboratorRole);
        collaboratorMembership.setAssignedLocation(location);
        collaboratorMembership.setStatus(MembershipStatus.ACTIVE);
        membershipRepository.save(collaboratorMembership);

        MembershipEntity workerMembership = new MembershipEntity();
        workerMembership.setOrganization(organization);
        workerMembership.setUser(worker);
        workerMembership.setRole(managerRole);
        workerMembership.setAssignedLocation(location);
        workerMembership.setStatus(MembershipStatus.ACTIVE);
        membershipRepository.save(workerMembership);
    }
}
