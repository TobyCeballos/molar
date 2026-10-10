package com.molar;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.persistence.*;

@Entity
class Professional {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
  String name;
  String specialty;
  String phone;
  String email;
  boolean active = true;
  String createdAt;
  public Long getId() { return id; }
  public String getName() { return name; }
  public String getSpecialty() { return specialty; }
  public String getPhone() { return phone; }
  public String getEmail() { return email; }
  public boolean isActive() { return active; }
}

interface ProfessionalRepository extends JpaRepository<Professional, Long> {}

@RestController
@RequestMapping("/api/professionals")
class ProfessionalController {
  private final ProfessionalRepository professionals;

  ProfessionalController(ProfessionalRepository professionals) { this.professionals = professionals; }

  @GetMapping List<Professional> list() { return professionals.findAll().stream().filter(p -> p.active).toList(); }

  @PostMapping Professional create(@RequestBody Map<String, Object> body) {
    String name = String.valueOf(body.getOrDefault("name", "")).trim();
    if (name.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del doctor es obligatorio");
    Professional p = new Professional();
    p.name = name;
    p.specialty = (String) body.get("specialty");
    p.phone = (String) body.get("phone");
    p.email = (String) body.get("email");
    p.createdAt = Instant.now().toString();
    return professionals.save(p);
  }
}
