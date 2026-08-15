// translations.js
export const TRANSLATIONS = {
  en: {
    start_intro: "Available commands:",
    start_assoc_prompt:
      "You are not associated with a Traccar account. Use /assoc to link your phone and Telegram chat.",
    start_commands:
      "/assoc - associate phone and Telegram chat_id (secure confirmation required)\n" +
      "/assoc telegram - show contact share button\n" +
      "/track - list devices in your group\n" +
      "/track <id> - show device location and status\n" +
      "/history <id> [n] - last n positions\n" +
      "/status <id> - device summary\n" +
      "/engine <id> on|off - send engine command (if supported)\n" +
      "/commands <id> <type> - send a custom command\n" +
      "/orders get|create|update|delete [params] - manage orders\n" +
      "/positions <id> [limit] - list recent positions\n" +
      "/reports <type> <id> [days] - generate report",
    assoc_no_phone:
      'Send /assoc <international_phone> or press the "Share contact" button.',
    assoc_invalid_phone:
      "Invalid phone. Send /assoc <international_phone> (e.g. +33123456789).",
    assoc_found_and_updated: "OK: ChatID associated to account: ",
    assoc_no_user_ask_email:
      'No Traccar user matches this phone. Please send the email associated with your Traccar account to update the profile, or send "cancel".',
    assoc_email_invalid: 'Invalid email. Send a valid email or "cancel".',
    assoc_email_not_found:
      'No Traccar user found for this email. Check and resend or send "cancel".',
    assoc_updated_by_email:
      "Profile updated: phone and ChatID saved for ",
    assoc_encrypted_required:
      "Secure confirmation required. Provide encrypted password as second argument: /assoc <phone> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "Confirmation failed: invalid encrypted password or server configuration.",
    assoc_confirm_success: "Association confirmed and saved for ",
    track_no_identifier:
      "Usage: /track <id> or /track to list devices in your group.",
    track_listing_devices: "Devices in your group:",
    track_device_not_found: "No device found for ",
    track_device_info_title: "Device",
    history_usage: "Usage: /history <id> [n]",
    status_usage: "Usage: /status <id>",
    engine_usage: "Usage: /engine <id> on|off",
    generic_error: "Internal error. See server logs.",
    cancel: "cancel",
    cancelled: "Operation cancelled.",
    share_contact_prompt:
      "Share your contact to associate your account (international format recommended).",
    no_positions: "No positions available.",
    engine_command_sent: "Engine command sent.",
    engine_command_failed: "Engine command failed.",
    commands_usage: "Usage: /commands <deviceId> <commandType>",
    command_sent: "Command sent successfully.",
    command_failed: "Failed to send command.",
    orders_usage: "Usage: /orders get|create|update|delete [params]",
    order_created: "Order created successfully.",
    order_updated: "Order updated successfully.",
    order_deleted: "Order deleted successfully.",
    order_failed: "Failed to process order.",
    positions_usage: "Usage: /positions <id> [limit]",
    positions_for: "Positions for",
    reports_usage: "Usage: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops"
  },
  fr: {
    start_intro: "Commandes disponibles :",
    start_assoc_prompt:
      "Vous n'êtes pas associé à un compte Traccar. Utilisez /assoc pour lier votre téléphone et Telegram.",
    start_commands:
      "/assoc - associer numéro et chat Telegram (confirmation sécurisée requise)\n" +
      "/assoc telegram - afficher le bouton de partage de contact\n" +
      "/track - lister les équipements du groupe\n" +
      "/track <id> - afficher la position et l'état d'un équipement\n" +
      "/history <id> [n] - dernières positions\n" +
      "/status <id> - résumé de l'équipement\n" +
      "/engine <id> on|off - envoyer commande moteur (si supporté)\n" +
      "/commands <id> <type> - envoyer une commande personnalisée\n" +
      "/orders get|create|update|delete [params] - gérer les ordres\n" +
      "/positions <id> [limite] - lister les positions récentes\n" +
      "/reports <type> <id> [jours] - générer un rapport",
    assoc_no_phone:
      'Envoyez /assoc <numero_international> ou appuyez sur le bouton "Partager mon contact".',
    assoc_invalid_phone:
      "Numéro invalide. Envoyez /assoc <numero_international> (ex: +33123456789).",
    assoc_found_and_updated: "OK : ChatID associé au compte : ",
    assoc_no_user_ask_email:
      'Aucun utilisateur Traccar ne correspond à ce numéro. Envoyez l\'adresse email associée à votre compte Traccar pour que je mette à jour le profil, ou envoyez "annuler".',
    assoc_email_invalid:
      'Adresse email invalide. Envoyez une adresse valide ou "annuler".',
    assoc_email_not_found:
      'Aucun utilisateur Traccar trouvé pour cette adresse email. Vérifiez et renvoyez ou envoyez "annuler".',
    assoc_updated_by_email:
      "Profil mis à jour : numéro et ChatID enregistrés pour ",
    assoc_encrypted_required:
      "Confirmation sécurisée requise. Fournissez le mot de passe chiffré en second argument : /assoc <numero> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "Confirmation échouée : mot de passe chiffré invalide ou configuration serveur manquante.",
    assoc_confirm_success:
      "Association confirmée et enregistrée pour ",
    track_no_identifier:
      "Usage : /track <id> ou /track pour lister les équipements de votre groupe.",
    track_listing_devices: "Équipements dans votre groupe :",
    track_device_not_found: "Aucun équipement trouvé pour ",
    track_device_info_title: "Équipement",
    history_usage: "Usage : /history <id> [n]",
    status_usage: "Usage : /status <id>",
    engine_usage: "Usage : /engine <id> on|off",
    generic_error: "Erreur interne. Voir les logs serveur.",
    cancel: "annuler",
    cancelled: "Opération annulée.",
    share_contact_prompt:
      "Partagez votre contact pour associer votre compte (format international recommandé).",
    no_positions: "Aucune position disponible.",
    engine_command_sent: "Commande moteur envoyée.",
    engine_command_failed: "Échec de la commande moteur.",
    commands_usage: "Usage : /commands <id> <type>",
    command_sent: "Commande envoyée avec succès.",
    command_failed: "Échec de l'envoi de la commande.",
    orders_usage: "Usage : /orders get|create|update|delete [params]",
    order_created: "Commande créée avec succès.",
    order_updated: "Commande mise à jour avec succès.",
    order_deleted: "Commande supprimée avec succès.",
    order_failed: "Échec du traitement de la commande.",
    positions_usage: "Usage : /positions <id> [limite]",
    positions_for: "Positions pour",
    reports_usage: "Usage : /reports <type> <id> [jours]\nTypes: route, events, geofences, summary, trips, stops"
  },
  es: {
    start_intro: "Comandos disponibles:",
    start_assoc_prompt:
      "No estás asociado a una cuenta Traccar. Usa /assoc para vincular tu teléfono y Telegram.",
    start_commands:
      "/assoc - asociar teléfono y chat de Telegram (confirmación segura requerida)\n" +
      "/assoc telegram - mostrar botón de compartir contacto\n" +
      "/track - listar dispositivos de tu grupo\n" +
      "/track <id> - mostrar ubicación y estado del dispositivo\n" +
      "/history <id> [n] - últimas n posiciones\n" +
      "/status <id> - resumen del dispositivo\n" +
      "/engine <id> on|off - enviar comando de motor (si soportado)\n" +
      "/commands <id> <type> - enviar comando personalizado\n" +
      "/orders get|create|update|delete [params] - gestionar órdenes\n" +
      "/positions <id> [limit] - listar posiciones recientes\n" +
      "/reports <type> <id> [days] - generar reporte",
    assoc_no_phone:
      'Envía /assoc <telefono_internacional> o pulsa el botón "Compartir contacto".',
    assoc_invalid_phone:
      "Teléfono inválido. Envía /assoc <telefono_internacional> (ej: +34123456789).",
    assoc_found_and_updated: "OK: ChatID asociado a la cuenta: ",
    assoc_no_user_ask_email:
      'Ningún usuario de Traccar coincide con este teléfono. Envía el email asociado a tu cuenta Traccar para actualizar el perfil, o envía "cancelar".',
    assoc_email_invalid: 'Email inválido. Envía un email válido o "cancelar".',
    assoc_email_not_found:
      'Ningún usuario de Traccar encontrado para este email. Verifica y reenvía o envía "cancelar".',
    assoc_updated_by_email:
      "Perfil actualizado: teléfono y ChatID guardados para ",
    assoc_encrypted_required:
      "Confirmación segura requerida. Proporciona la contraseña encriptada como segundo argumento: /assoc <telefono> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "Confirmación fallida: contraseña encriptada inválida o configuración del servidor faltante.",
    assoc_confirm_success: "Asociación confirmada y guardada para ",
    track_no_identifier:
      "Uso: /track <id> o /track para listar dispositivos de tu grupo.",
    track_listing_devices: "Dispositivos en tu grupo:",
    track_device_not_found: "Ningún dispositivo encontrado para ",
    track_device_info_title: "Dispositivo",
    history_usage: "Uso: /history <id> [n]",
    status_usage: "Uso: /status <id>",
    engine_usage: "Uso: /engine <id> on|off",
    generic_error: "Error interno. Consulta los logs del servidor.",
    cancel: "cancelar",
    cancelled: "Operación cancelada.",
    share_contact_prompt:
      "Comparte tu contacto para asociar tu cuenta (formato internacional recomendado).",
    no_positions: "No hay posiciones disponibles.",
    engine_command_sent: "Comando de motor enviado.",
    engine_command_failed: "Fallo del comando de motor.",
    commands_usage: "Uso: /commands <deviceId> <commandType>",
    command_sent: "Comando enviado correctamente.",
    command_failed: "Falló el envío del comando.",
    orders_usage: "Uso: /orders get|create|update|delete [params]",
    order_created: "Orden creada correctamente.",
    order_updated: "Orden actualizada correctamente.",
    order_deleted: "Orden eliminada correctamente.",
    order_failed: "Falló el procesamiento de la orden.",
    positions_usage: "Uso: /positions <id> [limit]",
    positions_for: "Posiciones para",
    reports_usage: "Uso: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops"
  },
  pt: {
    start_intro: "Comandos disponíveis:",
    start_assoc_prompt:
      "Você não está associado a uma conta Traccar. Use /assoc para vincular seu telefone e Telegram.",
    start_commands:
      "/assoc - associar telefone e chat do Telegram (confirmação segura necessária)\n" +
      "/assoc telegram - mostrar botão de compartilhar contato\n" +
      "/track - listar dispositivos do seu grupo\n" +
      "/track <id> - mostrar localização e status do dispositivo\n" +
      "/history <id> [n] - últimas n posições\n" +
      "/status <id> - resumo do dispositivo\n" +
      "/engine <id> on|off - enviar comando de motor (se suportado)\n" +
      "/commands <id> <type> - enviar comando personalizado\n" +
      "/orders get|create|update|delete [params] - gerenciar ordens\n" +
      "/positions <id> [limit] - listar posições recentes\n" +
      "/reports <type> <id> [days] - gerar relatório",
    assoc_no_phone:
      'Envie /assoc <telefone_internacional> ou pressione o botão "Compartilhar contato".',
    assoc_invalid_phone:
      "Telefone inválido. Envie /assoc <telefone_internacional> (ex: +5511912345678).",
    assoc_found_and_updated: "OK: ChatID associado à conta: ",
    assoc_no_user_ask_email:
      'Nenhum usuário do Traccar corresponde a este telefone. Envie o email associado à sua conta Traccar para atualizar o perfil, ou envie "cancelar".',
    assoc_email_invalid: 'Email inválido. Envie um email válido ou "cancelar".',
    assoc_email_not_found:
      'Nenhum usuário do Traccar encontrado para este email. Verifique e reenvie ou envie "cancelar".',
    assoc_updated_by_email:
      "Perfil atualizado: telefone e ChatID salvos para ",
    assoc_encrypted_required:
      "Confirmação segura necessária. Forneça a senha criptografada como segundo argumento: /assoc <telefone> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "Confirmação falhou: senha criptografada inválida ou configuração do servidor ausente.",
    assoc_confirm_success: "Associação confirmada e salva para ",
    track_no_identifier:
      "Uso: /track <id> ou /track para listar dispositivos do seu grupo.",
    track_listing_devices: "Dispositivos no seu grupo:",
    track_device_not_found: "Nenhum dispositivo encontrado para ",
    track_device_info_title: "Dispositivo",
    history_usage: "Uso: /history <id> [n]",
    status_usage: "Uso: /status <id>",
    engine_usage: "Uso: /engine <id> on|off",
    generic_error: "Erro interno. Consulte os logs do servidor.",
    cancel: "cancelar",
    cancelled: "Operação cancelada.",
    share_contact_prompt:
      "Compartilhe seu contato para associar sua conta (formato internacional recomendado).",
    no_positions: "Nenhuma posição disponível.",
    engine_command_sent: "Comando de motor enviado.",
    engine_command_failed: "Falha no comando de motor.",
    commands_usage: "Uso: /commands <deviceId> <commandType>",
    command_sent: "Comando enviado com sucesso.",
    command_failed: "Falha ao enviar comando.",
    orders_usage: "Uso: /orders get|create|update|delete [params]",
    order_created: "Ordem criada com sucesso.",
    order_updated: "Ordem atualizada com sucesso.",
    order_deleted: "Ordem excluída com sucesso.",
    order_failed: "Falha ao processar ordem.",
    positions_usage: "Uso: /positions <id> [limit]",
    positions_for: "Posições para",
    reports_usage: "Uso: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops"
  },
  tr: {
    start_intro: "Kullanılabilir komutlar:",
    start_assoc_prompt:
      "Bir Traccar hesabıyla ilişkilendirilmemişsiniz. Telefonunuzu ve Telegram'ı bağlamak için /assoc kullanın.",
    start_commands:
      "/assoc - telefon ve Telegram chat_id'yi ilişkilendir (güvenli onay gerekli)\n" +
      "/assoc telegram - kontakt paylaş butonunu göster\n" +
      "/track - grubunuzdaki cihazları listele\n" +
      "/track <id> - cihaz konumunu ve durumunu göster\n" +
      "/history <id> [n] - son n pozisyon\n" +
      "/status <id> - cihaz özeti\n" +
      "/engine <id> on|off - motor komutu gönder (destekleniyorsa)\n" +
      "/commands <id> <type> - özel komut gönder\n" +
      "/orders get|create|update|delete [params] - siparişleri yönet\n" +
      "/positions <id> [limit] - son pozisyonları listele\n" +
      "/reports <type> <id> [days] - rapor oluştur",
    assoc_no_phone:
      '/assoc <uluslararası_telefon> gönderin veya "Kişiyi Paylaş" butonuna basın.',
    assoc_invalid_phone:
      "Geçersiz telefon. /assoc <uluslararası_telefon> gönderin (örn: +905551234567).",
    assoc_found_and_updated: "OK: ChatID hesaba ilişkilendirildi: ",
    assoc_no_user_ask_email:
      "Bu telefonla eşleşen Traccar kullanıcısı yok. Profilinizi güncellemek için Traccar hesabınıza kayıtlı e-postayı gönderin veya 'iptal' yazın.",
    assoc_email_invalid: 'Geçersiz e-posta. Geçerli bir e-posta gönderin veya "iptal" yazın.',
    assoc_email_not_found:
      "Bu e-posta için Traccar kullanıcısı bulunamadı. Kontrol edip yeniden gönderin veya 'iptal' yazın.",
    assoc_updated_by_email:
      "Profil güncellendi: telefon ve ChatID kaydedildi: ",
    assoc_encrypted_required:
      "Güvenli onay gerekli. Şifreli parolayı ikinci argüman olarak sağlayın: /assoc <telefon> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "Onay başarısız: geçersiz şifreli parola veya sunucu yapılandırması eksik.",
    assoc_confirm_success: "İlişkilendirme onaylandı ve kaydedildi: ",
    track_no_identifier:
      "Kullanım: /track <id> veya grubunuzdaki cihazları listelemek için /track.",
    track_listing_devices: "Grup cihazları:",
    track_device_not_found: "Cihaz bulunamadı: ",
    track_device_info_title: "Cihaz",
    history_usage: "Kullanım: /history <id> [n]",
    status_usage: "Kullanım: /status <id>",
    engine_usage: "Kullanım: /engine <id> on|off",
    generic_error: "Dahili hata. Sunucu günlüklerine bakın.",
    cancel: "iptal",
    cancelled: "İşlem iptal edildi.",
    share_contact_prompt:
      "Hesabınızı ilişkilendirmek için kişinizi paylaşın (uluslararası format önerilir).",
    no_positions: "Pozisyon verisi yok.",
    engine_command_sent: "Motor komutu gönderildi.",
    engine_command_failed: "Motor komutu başarısız.",
    commands_usage: "Kullanım: /commands <deviceId> <commandType>",
    command_sent: "Komut başarıyla gönderildi.",
    command_failed: "Komut gönderilemedi.",
    orders_usage: "Kullanım: /orders get|create|update|delete [params]",
    order_created: "Sipariş başarıyla oluşturuldu.",
    order_updated: "Sipariş başarıyla güncellendi.",
    order_deleted: "Sipariş başarıyla silindi.",
    order_failed: "Sipariş işlenemedi.",
    positions_usage: "Kullanım: /positions <id> [limit]",
    positions_for: "Pozisyonlar: ",
    reports_usage: "Kullanım: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops"
  },
  ru: {
    start_intro: "Доступные команды:",
    start_assoc_prompt:
      "Вы не связаны с аккаунтом Traccar. Используйте /assoc для привязки телефона и Telegram.",
    start_commands:
      "/assoc - связать телефон и chat_id Telegram (требуется безопасное подтверждение)\n" +
      "/assoc telegram - показать кнопку обмена контактом\n" +
      "/track - список устройств в вашей группе\n" +
      "/track <id> - показать местоположение и статус устройства\n" +
      "/history <id> [n] - последние n позиций\n" +
      "/status <id> - сводка по устройству\n" +
      "/engine <id> on|off - отправить команду двигателя (если поддерживается)\n" +
      "/commands <id> <type> - отправить пользовательскую команду\n" +
      "/orders get|create|update|delete [params] - управлять заказами\n" +
      "/positions <id> [limit] - список последних позиций\n" +
      "/reports <type> <id> [days] - сгенерировать отчет",
    assoc_no_phone:
      'Отправьте /assoc <международный_телефон> или нажмите кнопку "Поделиться контактом".',
    assoc_invalid_phone:
      "Неверный телефон. Отправьте /assoc <международный_телефон> (напр. +79123456789).",
    assoc_found_and_updated: "OK: ChatID привязан к аккаунту: ",
    assoc_no_user_ask_email:
      "Ни один пользователь Traccar не соответствует этому телефону. Отправьте email, привязанный к вашему аккаунту Traccar, для обновления профиля, или отправьте \"отмена\".",
    assoc_email_invalid: 'Неверный email. Отправьте корректный email или "отмена".',
    assoc_email_not_found:
      "Пользователь Traccar не найден для этого email. Проверьте и отправьте снова или \"отмена\".",
    assoc_updated_by_email:
      "Профиль обновлен: телефон и ChatID сохранены для ",
    assoc_encrypted_required:
      "Требуется безопасное подтверждение. Укажите зашифрованный пароль вторым аргументом: /assoc <телефон> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "Подтверждение не удалось: неверный зашифрованный пароль или отсутствует конфигурация сервера.",
    assoc_confirm_success: "Связь подтверждена и сохранена для ",
    track_no_identifier:
      "Использование: /track <id> или /track для списка устройств вашей группы.",
    track_listing_devices: "Устройства в вашей группе:",
    track_device_not_found: "Устройство не найдено для ",
    track_device_info_title: "Устройство",
    history_usage: "Использование: /history <id> [n]",
    status_usage: "Использование: /status <id>",
    engine_usage: "Использование: /engine <id> on|off",
    generic_error: "Внутренняя ошибка. Смотрите логи сервера.",
    cancel: "отмена",
    cancelled: "Операция отменена.",
    share_contact_prompt:
      "Поделитесь контактом для привязки аккаунта (рекомендуется международный формат).",
    no_positions: "Позиций нет.",
    engine_command_sent: "Команда двигателя отправлена.",
    engine_command_failed: "Ошибка команды двигателя.",
    commands_usage: "Использование: /commands <deviceId> <commandType>",
    command_sent: "Команда успешно отправлена.",
    command_failed: "Не удалось отправить команду.",
    orders_usage: "Использование: /orders get|create|update|delete [params]",
    order_created: "Заказ успешно создан.",
    order_updated: "Заказ успешно обновлен.",
    order_deleted: "Заказ успешно удален.",
    order_failed: "Не удалось обработать заказ.",
    positions_usage: "Использование: /positions <id> [limit]",
    positions_for: "Позиции для",
    reports_usage: "Использование: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops"
  }
};