package com.molar;

import java.nio.file.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clinic-settings")
class ClinicSettingsController {
  private final Path file = Path.of(System.getenv().getOrDefault("APPDATA", Path.of(System.getProperty("user.home"), "AppData", "Roaming").toString()), "Molar", "data", "clinic-settings.properties");

  @GetMapping Map<String, String> get() {
    Properties properties = load();
    Map<String, String> result = new LinkedHashMap<>();
    result.put("doctorName", properties.getProperty("doctorName", ""));
    result.put("clinicName", properties.getProperty("clinicName", ""));
    result.put("appointmentReminder", properties.getProperty("appointmentReminder", "Hola, {patient}. Te recordamos tu turno con {doctor} en {clinic} para el {date} a las {time}. ¿Confirmás tu asistencia?"));
    result.put("cancelledAppointment", properties.getProperty("cancelledAppointment", "Hola, {patient}. Se canceló el turno anterior al tuyo y quedó libre el {date} a las {time}. Si querés adelantar porque te queda cómodo o andás por la zona, avisame."));
    result.put("rescheduledAppointment", properties.getProperty("rescheduledAppointment", "Hola, {patient}. Tu turno con {doctor} fue reprogramado para el {date} a las {time}."));
    return result;
  }

  @PutMapping Map<String, String> save(@RequestBody Map<String, String> body) {
    Properties properties = load();
    body.forEach((key, value) -> { if (Set.of("doctorName", "clinicName", "appointmentReminder", "cancelledAppointment", "rescheduledAppointment").contains(key)) properties.setProperty(key, Objects.requireNonNullElse(value, "")); });
    try { Files.createDirectories(file.getParent()); try (var out = Files.newOutputStream(file)) { properties.store(out, "Molar clinic settings"); } } catch (Exception e) { throw new IllegalStateException("No se pudo guardar la configuración de mensajes", e); }
    return get();
  }

  private Properties load() { Properties properties = new Properties(); if (Files.exists(file)) try (var in = Files.newInputStream(file)) { properties.load(in); } catch (Exception ignored) {} return properties; }
}
