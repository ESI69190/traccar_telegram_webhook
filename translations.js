// translations.js
export const TRANSLATIONS = {
  en: {
    start_intro: "Available commands:",
    start_assoc_prompt:
      "You are not associated with a Traccar account. Use /assoc to securely connect your Traccar account.",
    start_commands:
      "/assoc - securely connect your Traccar account\n" +
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
    miniapp_open_prompt:
      "Tap the button below to securely connect your Traccar account via Telegram Mini App.",
    miniapp_button_open: "Open Mini App",
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
    reports_usage: "Usage: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Your Traccar account has been successfully associated with Telegram.",
    miniapp_assoc_title: "Connect your Traccar account",
    miniapp_field_email_phone: "Email or phone",
    miniapp_field_password: "Password",
    miniapp_button_submit: "Connect account",
    miniapp_error_invalid_request: "Invalid request",
    miniapp_error_expired_session: "Expired Telegram session. Please reopen the Mini App.",
    miniapp_error_auth_failed: "Authentication failed. Check your credentials.",
    miniapp_error_already_associated: "This account is already associated with another Telegram user.",
    miniapp_error_config: "Configuration error. Please contact administrator.",
    miniapp_error_rate_limit: "Too many attempts. Please try again later."
  },
  fr: {
    start_intro: "Commandes disponibles :",
    start_assoc_prompt:
      "Vous n'êtes pas associé à un compte Traccar. Utilisez /assoc pour connecter votre compte Traccar de manière sécurisée.",
    start_commands:
      "/assoc - connecter votre compte Traccar de manière sécurisée\n" +
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
    miniapp_open_prompt:
      "Appuyez sur le bouton ci-dessous pour connecter votre compte Traccar de manière sécurisée via Telegram Mini App.",
    miniapp_button_open: "Ouvrir Mini App",
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
    reports_usage: "Usage : /reports <type> <id> [jours]\nTypes: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Votre compte Traccar a été associé avec succès à Telegram.",
    miniapp_assoc_title: "Connectez votre compte Traccar",
    miniapp_field_email_phone: "Email ou téléphone",
    miniapp_field_password: "Mot de passe",
    miniapp_button_submit: "Connecter le compte",
    miniapp_error_invalid_request: "Requête invalide",
    miniapp_error_expired_session: "Session Telegram expirée. Veuillez rouvrir la Mini App.",
    miniapp_error_auth_failed: "Échec de l'authentification. Vérifiez vos identifiants.",
    miniapp_error_already_associated: "Ce compte est déjà associé à un autre utilisateur Telegram.",
    miniapp_error_config: "Erreur de configuration. Contactez l'administrateur.",
    miniapp_error_rate_limit: "Trop de tentatives. Réessayez plus tard."
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
    miniapp_open_prompt:
      "Pulsa el botón de abajo para conectar tu cuenta de Traccar de forma segura mediante Telegram Mini App.",
    miniapp_button_open: "Abrir Mini App",
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
    reports_usage: "Uso: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Tu cuenta de Traccar se ha asociado correctamente con Telegram.",
    miniapp_assoc_title: "Conecta tu cuenta de Traccar",
    miniapp_field_email_phone: "Email o teléfono",
    miniapp_field_password: "Contraseña",
    miniapp_button_submit: "Conectar cuenta",
    miniapp_error_invalid_request: "Solicitud inválida",
    miniapp_error_expired_session: "Sesión de Telegram expirada. Vuelve a abrir la Mini App.",
    miniapp_error_auth_failed: "Error de autenticación. Verifica tus credenciales.",
    miniapp_error_already_associated: "Esta cuenta ya está asociada a otro usuario de Telegram.",
    miniapp_error_config: "Error de configuración. Contacta al administrador.",
    miniapp_error_rate_limit: "Demasiados intentos. Inténtalo de nuevo más tarde."
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
    miniapp_open_prompt:
      "Toque no botão abaixo para conectar sua conta do Traccar de forma segura via Telegram Mini App.",
    miniapp_button_open: "Abrir Mini App",
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
    reports_usage: "Uso: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Sua conta do Traccar foi associada com sucesso ao Telegram.",
    miniapp_assoc_title: "Conecte sua conta do Traccar",
    miniapp_field_email_phone: "Email ou telefone",
    miniapp_field_password: "Senha",
    miniapp_button_submit: "Conectar conta",
    miniapp_error_invalid_request: "Solicitação inválida",
    miniapp_error_expired_session: "Sessão do Telegram expirada. Reabra a Mini App.",
    miniapp_error_auth_failed: "Falha na autenticação. Verifique suas credenciais.",
    miniapp_error_already_associated: "Esta conta já está associada a outro usuário do Telegram.",
    miniapp_error_config: "Erro de configuração. Contate o administrador.",
    miniapp_error_rate_limit: "Muitas tentativas. Tente novamente mais tarde."
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
    miniapp_open_prompt:
      "Aşağıdaki düğmeye basarak Telegram Mini App üzerinden Traccar hesabınızı güvenli bir şekilde bağlayın.",
    miniapp_button_open: "Mini App'i Aç",
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
    reports_usage: "Kullanım: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Traccar hesabınız Telegram ile başarıyla ilişkilendirildi.",
    miniapp_assoc_title: "Traccar hesabınızı bağlayın",
    miniapp_field_email_phone: "E-posta veya telefon",
    miniapp_field_password: "Şifre",
    miniapp_button_submit: "Hesabı bağla",
    miniapp_error_invalid_request: "Geçersiz istek",
    miniapp_error_expired_session: "Telegram oturumu süresi doldu. Mini App'i yeniden açın.",
    miniapp_error_auth_failed: "Kimlik doğrulama başarısız. Bilgilerinizi kontrol edin.",
    miniapp_error_already_associated: "Bu hesap zaten başka bir Telegram kullanıcısıyla ilişkilendirilmiş.",
    miniapp_error_config: "Yapılandırma hatası. Yöneticiye başvurun.",
    miniapp_error_rate_limit: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin."
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
    miniapp_open_prompt:
      "Нажмите кнопку ниже, чтобы безопасно подключить ваш аккаунт Traccar через Telegram Mini App.",
    miniapp_button_open: "Открыть Mini App",
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
    reports_usage: "Использование: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Ваш аккаунт Traccar успешно связан с Telegram.",
    miniapp_assoc_title: "Подключите ваш аккаунт Traccar",
    miniapp_field_email_phone: "Email или телефон",
    miniapp_field_password: "Пароль",
    miniapp_button_submit: "Подключить аккаунт",
    miniapp_error_invalid_request: "Неверный запрос",
    miniapp_error_expired_session: "Сессия Telegram истекла. Пожалуйста, откройте Mini App снова.",
    miniapp_error_auth_failed: "Ошибка аутентификации. Проверьте ваши учетные данные.",
    miniapp_error_already_associated: "Этот аккаунт уже связан с другим пользователем Telegram.",
    miniapp_error_config: "Ошибка конфигурации. Обратитесь к администратору.",
    miniapp_error_rate_limit: "Слишком много попыток. Попробуйте позже."
  },
  zh: {
    start_intro: "可用命令：",
    start_assoc_prompt:
      "您未关联 Traccar 账户。请使用 /assoc 安全连接您的 Traccar 账户。",
    start_commands:
      "/assoc - 安全连接您的 Traccar 账户\n" +
      "/track - 列出您组内的设备\n" +
      "/track <id> - 显示设备位置和状态\n" +
      "/history <id> [n] - 最近 n 个位置\n" +
      "/status <id> - 设备摘要\n" +
      "/engine <id> on|off - 发送引擎命令（如支持）\n" +
      "/commands <id> <type> - 发送自定义命令\n" +
      "/orders get|create|update|delete [params] - 管理订单\n" +
      "/positions <id> [limit] - 列出最近位置\n" +
      "/reports <type> <id> [days] - 生成报告",
    assoc_no_phone:
      '发送 /assoc <国际电话号码> 或点击"分享联系人"按钮。',
    assoc_invalid_phone:
      "电话号码无效。发送 /assoc <国际电话号码>（例如：+8613812345678）。",
    assoc_found_and_updated: "OK：ChatID 已关联至账户：",
    assoc_no_user_ask_email:
      '未找到匹配此电话的 Traccar 用户。请发送与您的 Traccar 账户关联的电子邮件以更新个人资料，或发送"取消"。',
    assoc_email_invalid: '电子邮件无效。请发送有效的电子邮件或"取消"。',
    assoc_email_not_found:
      '未找到此电子邮件对应的 Traccar 用户。请检查后重新发送或发送"取消"。',
    assoc_updated_by_email:
      "个人资料已更新：电话和 ChatID 已保存，用户 ",
    assoc_encrypted_required:
      "需要安全确认。请提供加密密码作为第二个参数：/assoc <电话> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "确认失败：加密密码无效或服务器配置错误。",
    assoc_confirm_success: "关联已确认并保存，用户 ",
    track_no_identifier:
      "用法：/track <id> 或 /track 列出您组内的设备。",
    track_listing_devices: "您组内的设备：",
    track_device_not_found: "未找到设备：",
    track_device_info_title: "设备",
    history_usage: "用法：/history <id> [n]",
    status_usage: "用法：/status <id>",
    engine_usage: "用法：/engine <id> on|off",
    generic_error: "内部错误。请查看服务器日志。",
    cancel: "取消",
    cancelled: "操作已取消。",
    share_contact_prompt:
      "分享您的联系人以关联账户（推荐使用国际格式）。",
    miniapp_open_prompt:
      "点击下方按钮，通过 Telegram Mini App 安全连接您的 Traccar 账户。",
    miniapp_button_open: "打开 Mini App",
    no_positions: "暂无位置数据。",
    engine_command_sent: "引擎命令已发送。",
    engine_command_failed: "引擎命令发送失败。",
    commands_usage: "用法：/commands <deviceId> <commandType>",
    command_sent: "命令发送成功。",
    command_failed: "命令发送失败。",
    orders_usage: "用法：/orders get|create|update|delete [params]",
    order_created: "订单创建成功。",
    order_updated: "订单更新成功。",
    order_deleted: "订单删除成功。",
    order_failed: "订单处理失败。",
    positions_usage: "用法：/positions <id> [limit]",
    positions_for: "位置信息：",
    reports_usage: "用法：/reports <type> <id> [days]\n类型：route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "您的 Traccar 账户已成功与 Telegram 关联。",
    miniapp_assoc_title: "连接您的 Traccar 账户",
    miniapp_field_email_phone: "电子邮件或电话",
    miniapp_field_password: "密码",
    miniapp_button_submit: "连接账户",
    miniapp_error_invalid_request: "无效请求",
    miniapp_error_expired_session: "Telegram 会话已过期。请重新打开 Mini App。",
    miniapp_error_auth_failed: "认证失败。请检查您的凭据。",
    miniapp_error_already_associated: "该账户已与另一 Telegram 用户关联。",
    miniapp_error_config: "配置错误。请联系管理员。",
    miniapp_error_rate_limit: "尝试次数过多。请稍后再试。"
  },
  ja: {
    start_intro: "利用可能なコマンド：",
    start_assoc_prompt:
      "Traccar アカウントと関連付けられていません。/assoc を使用して安全に Traccar アカウントを接続してください。",
    start_commands:
      "/assoc - Traccar アカウントを安全に接続\n" +
      "/track - グループ内のデバイスを一覧表示\n" +
      "/track <id> - デバイスの位置とステータスを表示\n" +
      "/history <id> [n] - 直近 n 件の位置情報\n" +
      "/status <id> - デバイスの概要\n" +
      "/engine <id> on|off - エンジン コマンドを送信（対応している場合）\n" +
      "/commands <id> <type> - カスタム コマンドを送信\n" +
      "/orders get|create|update|delete [params] - 注文を管理\n" +
      "/positions <id> [limit] - 最近の位置情報を一覧表示\n" +
      "/reports <type> <id> [days] - レポートを生成",
    assoc_no_phone:
      '/assoc <国際電話番号> を送信するか、「連絡先を共有」ボタンを押してください。',
    assoc_invalid_phone:
      "電話番号が無効です。/assoc <国際電話番号>（例：+819012345678）を送信してください。",
    assoc_found_and_updated: "OK：ChatID をアカウントに関連付けました：",
    assoc_no_user_ask_email:
      'この電話番号に一致する Traccar ユーザーが見つかりません。Traccar アカウントに登録されているメールアドレスを送信してプロフィールを更新するか、「キャンセル」を送信してください。',
    assoc_email_invalid: 'メールアドレスが無効です。有効なメールアドレスまたは「キャンセル」を送信してください。',
    assoc_email_not_found:
      'このメールアドレスに対応する Traccar ユーザーが見つかりません。確認して再送信するか、「キャンセル」を送信してください。',
    assoc_updated_by_email:
      "プロフィールを更新しました：電話番号と ChatID を保存しました：",
    assoc_encrypted_required:
      "安全な確認が必要です。暗号化パスワードを第2引数として指定してください：/assoc <電話番号> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "確認に失敗しました：暗号化パスワードが無いか、サーバー設定に問題があります。",
    assoc_confirm_success: "関連付けが確認され、保存されました：",
    track_no_identifier:
      "使い方：/track <id> または /track でグループ内のデバイスを一覧表示。",
    track_listing_devices: "グループ内のデバイス：",
    track_device_not_found: "デバイスが見つかりません：",
    track_device_info_title: "デバイス",
    history_usage: "使い方：/history <id> [n]",
    status_usage: "使い方：/status <id>",
    engine_usage: "使い方：/engine <id> on|off",
    generic_error: "内部エラーが発生しました。サーバーログを確認してください。",
    cancel: "キャンセル",
    cancelled: "操作をキャンセルしました。",
    share_contact_prompt:
      "アカウントを関連付けるために連絡先を共有してください（国際形式を推奨）。",
    miniapp_open_prompt:
      "下のボタンをタップして、Telegram Mini App 経由で Traccar アカウントを安全に接続してください。",
    miniapp_button_open: "Mini App を開く",
    no_positions: "位置情報がありません。",
    engine_command_sent: "エンジンコマンドを送信しました。",
    engine_command_failed: "エンジンコマンドの送信に失敗しました。",
    commands_usage: "使い方：/commands <deviceId> <commandType>",
    command_sent: "コマンドを正常に送信しました。",
    command_failed: "コマンドの送信に失敗しました。",
    orders_usage: "使い方：/orders get|create|update|delete [params]",
    order_created: "注文を正常に作成しました。",
    order_updated: "注文を正常に更新しました。",
    order_deleted: "注文を正常に削除しました。",
    order_failed: "注文の処理に失敗しました。",
    positions_usage: "使い方：/positions <id> [limit]",
    positions_for: "位置情報：",
    reports_usage: "使い方：/reports <type> <id> [days]\nタイプ：route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Traccar アカウントが Telegram と正常に関連付けられました。",
    miniapp_assoc_title: "Traccar アカウントを接続",
    miniapp_field_email_phone: "メールアドレスまたは電話番号",
    miniapp_field_password: "パスワード",
    miniapp_button_submit: "アカウントを接続",
    miniapp_error_invalid_request: "無効なリクエスト",
    miniapp_error_expired_session: "Telegram セッションが期限切れです。Mini App を再度開いてください。",
    miniapp_error_auth_failed: "認証に失敗しました。認証情報を確認してください。",
    miniapp_error_already_associated: "このアカウントは別の Telegram ユーザーと既に関連付けられています。",
    miniapp_error_config: "設定エラーです。管理者にお問い合わせください。",
    miniapp_error_rate_limit: "試行回数が多すぎます。後でもう一度お試しください。"
  },
  de: {
    start_intro: "Verfügbare Befehle:",
    start_assoc_prompt:
      "Sie sind nicht mit einem Traccar-Konto verknüpft. Verwenden Sie /assoc, um Ihr Traccar-Konto sicher zu verbinden.",
    start_commands:
      "/assoc - Traccar-Konto sicher verbinden\n" +
      "/track - Geräte in Ihrer Gruppe auflisten\n" +
      "/track <id> - Gerätestandort und -status anzeigen\n" +
      "/history <id> [n] - letzte n Positionen\n" +
      "/status <id> - Gerätezusammenfassung\n" +
      "/engine <id> on|off - Motor-Befehl senden (falls unterstützt)\n" +
      "/commands <id> <type> - Benutzerdefinierten Befehl senden\n" +
      "/orders get|create|update|delete [params] - Aufträge verwalten\n" +
      "/positions <id> [limit] - letzte Positionen auflisten\n" +
      "/reports <type> <id> [days] - Bericht erstellen",
    assoc_no_phone:
      'Senden Sie /assoc <internationale_telefonnummer> oder drücken Sie den "Kontakt teilen"-Button.',
    assoc_invalid_phone:
      "Ungültige Telefonnummer. Senden Sie /assoc <internationale_telefonnummer> (z. B. +491712345678).",
    assoc_found_and_updated: "OK: ChatID mit Konto verknüpft: ",
    assoc_no_user_ask_email:
      'Kein Traccar-Benutzer für diese Telefonnummer gefunden. Senden Sie die mit Ihrem Traccar-Konto verknüpfte E-Mail-Adresse, um das Profil zu aktualisieren, oder senden Sie "abbrechen".',
    assoc_email_invalid: 'Ungültige E-Mail-Adresse. Senden Sie eine gültige Adresse oder "abbrechen".',
    assoc_email_not_found:
      'Kein Traccar-Benutzer für diese E-Mail-Adresse gefunden. Prüfen Sie und senden Sie erneut oder "abbrechen".',
    assoc_updated_by_email:
      "Profil aktualisiert: Telefonnummer und ChatID gespeichert für ",
    assoc_encrypted_required:
      "Sichere Bestätigung erforderlich. Geben Sie das verschlüsselte Passwort als zweites Argument an: /assoc <telefon> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "Bestätigung fehlgeschlagen: ungültiges verschlüsseltes Passwort oder fehlende Serverkonfiguration.",
    assoc_confirm_success: "Verknüpfung bestätigt und gespeichert für ",
    track_no_identifier:
      "Verwendung: /track <id> oder /track zum Auflisten der Geräte in Ihrer Gruppe.",
    track_listing_devices: "Geräte in Ihrer Gruppe:",
    track_device_not_found: "Kein Gerät gefunden für ",
    track_device_info_title: "Gerät",
    history_usage: "Verwendung: /history <id> [n]",
    status_usage: "Verwendung: /status <id>",
    engine_usage: "Verwendung: /engine <id> on|off",
    generic_error: "Interner Fehler. Siehe Server-Logs.",
    cancel: "abbrechen",
    cancelled: "Vorgang abgebrochen.",
    share_contact_prompt:
      "Teilen Sie Ihren Kontakt, um Ihr Konto zu verknüpfen (internationales Format empfohlen).",
    miniapp_open_prompt:
      "Tippen Sie auf den untenstehenden Button, um Ihr Traccar-Konto sicher über die Telegram Mini App zu verbinden.",
    miniapp_button_open: "Mini App öffnen",
    no_positions: "Keine Positionen verfügbar.",
    engine_command_sent: "Motor-Befehl gesendet.",
    engine_command_failed: "Motor-Befehl fehlgeschlagen.",
    commands_usage: "Verwendung: /commands <deviceId> <commandType>",
    command_sent: "Befehl erfolgreich gesendet.",
    command_failed: "Befehl konnte nicht gesendet werden.",
    orders_usage: "Verwendung: /orders get|create|update|delete [params]",
    order_created: "Auftrag erfolgreich erstellt.",
    order_updated: "Auftrag erfolgreich aktualisiert.",
    order_deleted: "Auftrag erfolgreich gelöscht.",
    order_failed: "Auftragsverarbeitung fehlgeschlagen.",
    positions_usage: "Verwendung: /positions <id> [limit]",
    positions_for: "Positionen für",
    reports_usage: "Verwendung: /reports <type> <id> [days]\nTypen: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Ihr Traccar-Konto wurde erfolgreich mit Telegram verknüpft.",
    miniapp_assoc_title: "Traccar-Konto verbinden",
    miniapp_field_email_phone: "E-Mail oder Telefon",
    miniapp_field_password: "Passwort",
    miniapp_button_submit: "Konto verbinden",
    miniapp_error_invalid_request: "Ungültige Anfrage",
    miniapp_error_expired_session: "Telegram-Sitzung abgelaufen. Bitte Mini App erneut öffnen.",
    miniapp_error_auth_failed: "Authentifizierung fehlgeschlagen. Prüfen Sie Ihre Anmeldedaten.",
    miniapp_error_already_associated: "Dieses Konto ist bereits mit einem anderen Telegram-Benutzer verknüpft.",
    miniapp_error_config: "Konfigurationsfehler. Bitte Administrator kontaktieren.",
    miniapp_error_rate_limit: "Zu viele Versuche. Bitte später erneut versuchen."
  },
  ko: {
    start_intro: "사용 가능한 명령어:",
    start_assoc_prompt:
      "Traccar 계정과 연결되어 있지 않습니다. /assoc을 사용하여 Traccar 계정을 안전하게 연결하세요.",
    start_commands:
      "/assoc - Traccar 계정 안전하게 연결\n" +
      "/track - 그룹 내 기기 목록 보기\n" +
      "/track <id> - 기기 위치 및 상태 보기\n" +
      "/history <id> [n] - 최근 n개 위치 기록\n" +
      "/status <id> - 기기 요약 정보\n" +
      "/engine <id> on|off - 엔진 켜기/끄기 명령 전송 (지원 시)\n" +
      "/commands <id> <type> - 사용자 정의 명령 전송\n" +
      "/orders get|create|update|delete [params] - 주문 관리\n" +
      "/positions <id> [limit] - 최근 위치 목록 보기\n" +
      "/reports <type> <id> [days] - 보고서 생성",
    assoc_no_phone:
      '/assoc <국제전화번호>를 보내거나 "연락처 공유" 버튼을 누르세요.',
    assoc_invalid_phone:
      "잘못된 전화번호입니다. /assoc <국제전화번호> (예: +821012345678)를 보내세요.",
    assoc_found_and_updated: "확인: ChatID가 계정에 연결되었습니다: ",
    assoc_no_user_ask_email:
      '이 전화번호와 일치하는 Traccar 사용자가 없습니다. Traccar 계정과 연결된 이메일을 보내 프로필을 업데이트하거나 "취소"를 보내세요.',
    assoc_email_invalid: '잘못된 이메일입니다. 올바른 이메일을 보내거나 "취소"를 보내세요.',
    assoc_email_not_found:
      '이 이메일로 등록된 Traccar 사용자를 찾을 수 없습니다. 확인 후 다시 보내거나 "취소"를 보내세요.',
    assoc_updated_by_email:
      "프로필 업데이트됨: 전화번호와 ChatID가 저장되었습니다: ",
    assoc_encrypted_required:
      "안전한 확인이 필요합니다. 암호화된 비밀번호를 두 번째 인자로 제공하세요: /assoc <전화번호> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "확인 실패: 잘못된 암호화 비밀번호 또는 서버 설정 오류.",
    assoc_confirm_success: "연결이 확인되고 저장되었습니다: ",
    track_no_identifier:
      "사용법: /track <id> 또는 /track (그룹 내 기기 목록 보기).",
    track_listing_devices: "그룹 내 기기:",
    track_device_not_found: "기기를 찾을 수 없음: ",
    track_device_info_title: "기기",
    history_usage: "사용법: /history <id> [n]",
    status_usage: "사용법: /status <id>",
    engine_usage: "사용법: /engine <id> on|off",
    generic_error: "내부 오류 발생. 서버 로그를 확인하세요.",
    cancel: "취소",
    cancelled: "작업이 취소되었습니다.",
    share_contact_prompt:
      "계정 연결을 위해 연락처를 공유하세요 (국제 형식 권장).",
    miniapp_open_prompt:
      "아래 버튼을 눌러 Telegram Mini App을 통해 Traccar 계정을 안전하게 연결하세요.",
    miniapp_button_open: "Mini App 열기",
    no_positions: "위치 정보가 없습니다.",
    engine_command_sent: "엔진 명령 전송됨.",
    engine_command_failed: "엔진 명령 실패.",
    commands_usage: "사용법: /commands <deviceId> <commandType>",
    command_sent: "명령이 성공적으로 전송되었습니다.",
    command_failed: "명령 전송 실패.",
    orders_usage: "사용법: /orders get|create|update|delete [params]",
    order_created: "주문이 성공적으로 생성되었습니다.",
    order_updated: "주문이 성공적으로 업데이트되었습니다.",
    order_deleted: "주문이 성공적으로 삭제되었습니다.",
    order_failed: "주문 처리 실패.",
    positions_usage: "사용법: /positions <id> [limit]",
    positions_for: "위치 정보: ",
    reports_usage: "사용법: /reports <type> <id> [days]\n유형: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Traccar 계정이 Telegram과 성공적으로 연결되었습니다.",
    miniapp_assoc_title: "Traccar 계정 연결",
    miniapp_field_email_phone: "이메일 또는 전화번호",
    miniapp_field_password: "비밀번호",
    miniapp_button_submit: "계정 연결",
    miniapp_error_invalid_request: "잘못된 요청",
    miniapp_error_expired_session: "Telegram 세션이 만료되었습니다. Mini App을 다시 여세요.",
    miniapp_error_auth_failed: "인증 실패. 자격 증명을 확인하세요.",
    miniapp_error_already_associated: "이 계정은 이미 다른 Telegram 사용자와 연결되어 있습니다.",
    miniapp_error_config: "설정 오류. 관리자에게 문의하세요.",
    miniapp_error_rate_limit: "시도 횟수가 너무 많습니다. 나중에 다시 시도하세요."
  },
  it: {
    start_intro: "Comandi disponibili:",
    start_assoc_prompt:
      "Non sei associato a un account Traccar. Usa /assoc per collegare in modo sicuro il tuo account Traccar.",
    start_commands:
      "/assoc - collegare in modo sicuro il tuo account Traccar\n" +
      "/track - elencare i dispositivi del tuo gruppo\n" +
      "/track <id> - mostrare posizione e stato del dispositivo\n" +
      "/history <id> [n] - ultime n posizioni\n" +
      "/status <id> - riepilogo dispositivo\n" +
      "/engine <id> on|off - inviare comando motore (se supportato)\n" +
      "/commands <id> <type> - inviare comando personalizzato\n" +
      "/orders get|create|update|delete [params] - gestire ordini\n" +
      "/positions <id> [limit] - elencare posizioni recenti\n" +
      "/reports <type> <id> [days] - generare report",
    assoc_no_phone:
      'Inserisci /assoc <numero_internazionale> o premi il pulsante "Condividi contatto".',
    assoc_invalid_phone:
      "Numero di telefono non valido. Inserisci /assoc <numero_internazionale> (es. +393XX1234567).",
    assoc_found_and_updated: "OK: ChatID associato all'account: ",
    assoc_no_user_ask_email:
      'Nessun utente Traccar corrisponde a questo numero. Invia l\'email associata al tuo account Traccar per aggiornare il profilo, oppure invia "annulla".',
    assoc_email_invalid: 'Email non valida. Invia un\'email valida o "annulla".',
    assoc_email_not_found:
      'Nessun utente Traccar trovato per questa email. Verifica e reinvia o invia "annulla".',
    assoc_updated_by_email:
      "Profilo aggiornato: numero di telefono e ChatID salvati per ",
    assoc_encrypted_required:
      "Conferma sicura richiesta. Fornisci la password crittografata come secondo argomento: /assoc <telefono> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "Conferma fallita: password crittografata non valida o configurazione server mancante.",
    assoc_confirm_success: "Associazione confermata e salvata per ",
    track_no_identifier:
      "Utilizzo: /track <id> o /track per elencare i dispositivi del tuo gruppo.",
    track_listing_devices: "Dispositivi nel tuo gruppo:",
    track_device_not_found: "Nessun dispositivo trovato per ",
    track_device_info_title: "Dispositivo",
    history_usage: "Utilizzo: /history <id> [n]",
    status_usage: "Utilizzo: /status <id>",
    engine_usage: "Utilizzo: /engine <id> on|off",
    generic_error: "Errore interno. Consultare i log del server.",
    cancel: "annulla",
    cancelled: "Operazione annullata.",
    share_contact_prompt:
      "Condividi il tuo contatto per associare l'account (formato internazionale consigliato).",
    miniapp_open_prompt:
      "Tocca il pulsante qui sotto per collegare in modo sicuro il tuo account Traccar tramite Telegram Mini App.",
    miniapp_button_open: "Apri Mini App",
    no_positions: "Nessuna posizione disponibile.",
    engine_command_sent: "Comando motore inviato.",
    engine_command_failed: "Comando motore fallito.",
    commands_usage: "Utilizzo: /commands <deviceId> <commandType>",
    command_sent: "Comando inviato con successo.",
    command_failed: "Invio comando fallito.",
    orders_usage: "Utilizzo: /orders get|create|update|delete [params]",
    order_created: "Ordine creato con successo.",
    order_updated: "Ordine aggiornato con successo.",
    order_deleted: "Ordine eliminato con successo.",
    order_failed: "Elaborazione ordine fallita.",
    positions_usage: "Utilizzo: /positions <id> [limit]",
    positions_for: "Posizioni per",
    reports_usage: "Utilizzo: /reports <type> <id> [days]\nTipi: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Il tuo account Traccar è stato associato con successo a Telegram.",
    miniapp_assoc_title: "Collega il tuo account Traccar",
    miniapp_field_email_phone: "Email o telefono",
    miniapp_field_password: "Password",
    miniapp_button_submit: "Collega account",
    miniapp_error_invalid_request: "Richiesta non valida",
    miniapp_error_expired_session: "Sessione Telegram scaduta. Riapri la Mini App.",
    miniapp_error_auth_failed: "Autenticazione fallita. Verifica le tue credenziali.",
    miniapp_error_already_associated: "Questo account è già associato a un altro utente Telegram.",
    miniapp_error_config: "Errore di configurazione. Contatta l'amministratore.",
    miniapp_error_rate_limit: "Troppi tentativi. Riprova più tardi."
  }
};