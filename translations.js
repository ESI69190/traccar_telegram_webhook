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
      "Vous n'Ãªtes pas associÃ© Ã  un compte Traccar. Utilisez /assoc pour connecter votre compte Traccar de maniÃ¨re sÃ©curisÃ©e.",
    start_commands:
      "/assoc - connecter votre compte Traccar de maniÃ¨re sÃ©curisÃ©e\n" +
      "/track - lister les Ã©quipements du groupe\n" +
      "/track <id> - afficher la position et l'Ã©tat d'un Ã©quipement\n" +
      "/history <id> [n] - derniÃ¨res positions\n" +
      "/status <id> - rÃ©sumÃ© de l'Ã©quipement\n" +
      "/engine <id> on|off - envoyer commande moteur (si supportÃ©)\n" +
      "/commands <id> <type> - envoyer une commande personnalisÃ©e\n" +
      "/orders get|create|update|delete [params] - gÃ©rer les ordres\n" +
      "/positions <id> [limite] - lister les positions rÃ©centes\n" +
      "/reports <type> <id> [jours] - gÃ©nÃ©rer un rapport",
    assoc_no_phone:
      'Envoyez /assoc <numero_international> ou appuyez sur le bouton "Partager mon contact".',
    assoc_invalid_phone:
      "NumÃ©ro invalide. Envoyez /assoc <numero_international> (ex: +33123456789).",
    assoc_found_and_updated: "OK : ChatID associÃ© au compte : ",
    assoc_no_user_ask_email:
      'Aucun utilisateur Traccar ne correspond Ã  ce numÃ©ro. Envoyez l\'adresse email associÃ©e Ã  votre compte Traccar pour que je mette Ã  jour le profil, ou envoyez "annuler".',
    assoc_email_invalid:
      'Adresse email invalide. Envoyez une adresse valide ou "annuler".',
    assoc_email_not_found:
      'Aucun utilisateur Traccar trouvÃ© pour cette adresse email. VÃ©rifiez et renvoyez ou envoyez "annuler".',
    assoc_updated_by_email:
      "Profil mis Ã  jour : numÃ©ro et ChatID enregistrÃ©s pour ",
    assoc_encrypted_required:
      "Confirmation sÃ©curisÃ©e requise. Fournissez le mot de passe chiffrÃ© en second argument : /assoc <numero> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "Confirmation Ã©chouÃ©e : mot de passe chiffrÃ© invalide ou configuration serveur manquante.",
    assoc_confirm_success:
      "Association confirmÃ©e et enregistrÃ©e pour ",
    track_no_identifier:
      "Usage : /track <id> ou /track pour lister les Ã©quipements de votre groupe.",
    track_listing_devices: "Ã‰quipements dans votre groupe :",
    track_device_not_found: "Aucun Ã©quipement trouvÃ© pour ",
    track_device_info_title: "Ã‰quipement",
    history_usage: "Usage : /history <id> [n]",
    status_usage: "Usage : /status <id>",
    engine_usage: "Usage : /engine <id> on|off",
    generic_error: "Erreur interne. Voir les logs serveur.",
    cancel: "annuler",
    cancelled: "OpÃ©ration annulÃ©e.",
    share_contact_prompt:
      "Partagez votre contact pour associer votre compte (format international recommandÃ©).",
    miniapp_open_prompt:
      "Appuyez sur le bouton ci-dessous pour connecter votre compte Traccar de maniÃ¨re sÃ©curisÃ©e via Telegram Mini App.",
    miniapp_button_open: "Ouvrir Mini App",
    no_positions: "Aucune position disponible.",
    engine_command_sent: "Commande moteur envoyÃ©e.",
    engine_command_failed: "Ã‰chec de la commande moteur.",
    commands_usage: "Usage : /commands <id> <type>",
    command_sent: "Commande envoyÃ©e avec succÃ¨s.",
    command_failed: "Ã‰chec de l'envoi de la commande.",
    orders_usage: "Usage : /orders get|create|update|delete [params]",
    order_created: "Commande crÃ©Ã©e avec succÃ¨s.",
    order_updated: "Commande mise Ã  jour avec succÃ¨s.",
    order_deleted: "Commande supprimÃ©e avec succÃ¨s.",
    order_failed: "Ã‰chec du traitement de la commande.",
    positions_usage: "Usage : /positions <id> [limite]",
    positions_for: "Positions pour",
    reports_usage: "Usage : /reports <type> <id> [jours]\nTypes: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Votre compte Traccar a Ã©tÃ© associÃ© avec succÃ¨s Ã  Telegram.",
    miniapp_assoc_title: "Connectez votre compte Traccar",
    miniapp_field_email_phone: "Email ou tÃ©lÃ©phone",
    miniapp_field_password: "Mot de passe",
    miniapp_button_submit: "Connecter le compte",
    miniapp_error_invalid_request: "RequÃªte invalide",
    miniapp_error_expired_session: "Session Telegram expirÃ©e. Veuillez rouvrir la Mini App.",
    miniapp_error_auth_failed: "Ã‰chec de l'authentification. VÃ©rifiez vos identifiants.",
    miniapp_error_already_associated: "Ce compte est dÃ©jÃ  associÃ© Ã  un autre utilisateur Telegram.",
    miniapp_error_config: "Erreur de configuration. Contactez l'administrateur.",
    miniapp_error_rate_limit: "Trop de tentatives. RÃ©essayez plus tard."
  },
  es: {
    start_intro: "Comandos disponibles:",
    start_assoc_prompt:
      "No estÃ¡s asociado a una cuenta Traccar. Usa /assoc para vincular tu telÃ©fono y Telegram.",
    start_commands:
      "/assoc - asociar telÃ©fono y chat de Telegram (confirmaciÃ³n segura requerida)\n" +
      "/assoc telegram - mostrar botÃ³n de compartir contacto\n" +
      "/track - listar dispositivos de tu grupo\n" +
      "/track <id> - mostrar ubicaciÃ³n y estado del dispositivo\n" +
      "/history <id> [n] - Ãºltimas n posiciones\n" +
      "/status <id> - resumen del dispositivo\n" +
      "/engine <id> on|off - enviar comando de motor (si soportado)\n" +
      "/commands <id> <type> - enviar comando personalizado\n" +
      "/orders get|create|update|delete [params] - gestionar Ã³rdenes\n" +
      "/positions <id> [limit] - listar posiciones recientes\n" +
      "/reports <type> <id> [days] - generar reporte",
    assoc_no_phone:
      'EnvÃ­a /assoc <telefono_internacional> o pulsa el botÃ³n "Compartir contacto".',
    assoc_invalid_phone:
      "TelÃ©fono invÃ¡lido. EnvÃ­a /assoc <telefono_internacional> (ej: +34123456789).",
    assoc_found_and_updated: "OK: ChatID asociado a la cuenta: ",
    assoc_no_user_ask_email:
      'NingÃºn usuario de Traccar coincide con este telÃ©fono. EnvÃ­a el email asociado a tu cuenta Traccar para actualizar el perfil, o envÃ­a "cancelar".',
    assoc_email_invalid: 'Email invÃ¡lido. EnvÃ­a un email vÃ¡lido o "cancelar".',
    assoc_email_not_found:
      'NingÃºn usuario de Traccar encontrado para este email. Verifica y reenvÃ­a o envÃ­a "cancelar".',
    assoc_updated_by_email:
      "Perfil actualizado: telÃ©fono y ChatID guardados para ",
    assoc_encrypted_required:
      "ConfirmaciÃ³n segura requerida. Proporciona la contraseÃ±a encriptada como segundo argumento: /assoc <telefono> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "ConfirmaciÃ³n fallida: contraseÃ±a encriptada invÃ¡lida o configuraciÃ³n del servidor faltante.",
    assoc_confirm_success: "AsociaciÃ³n confirmada y guardada para ",
    track_no_identifier:
      "Uso: /track <id> o /track para listar dispositivos de tu grupo.",
    track_listing_devices: "Dispositivos en tu grupo:",
    track_device_not_found: "NingÃºn dispositivo encontrado para ",
    track_device_info_title: "Dispositivo",
    history_usage: "Uso: /history <id> [n]",
    status_usage: "Uso: /status <id>",
    engine_usage: "Uso: /engine <id> on|off",
    generic_error: "Error interno. Consulta los logs del servidor.",
    cancel: "cancelar",
    cancelled: "OperaciÃ³n cancelada.",
    share_contact_prompt:
      "Comparte tu contacto para asociar tu cuenta (formato internacional recomendado).",
    miniapp_open_prompt:
      "Pulsa el botÃ³n de abajo para conectar tu cuenta de Traccar de forma segura mediante Telegram Mini App.",
    miniapp_button_open: "Abrir Mini App",
    no_positions: "No hay posiciones disponibles.",
    engine_command_sent: "Comando de motor enviado.",
    engine_command_failed: "Fallo del comando de motor.",
    commands_usage: "Uso: /commands <deviceId> <commandType>",
    command_sent: "Comando enviado correctamente.",
    command_failed: "FallÃ³ el envÃ­o del comando.",
    orders_usage: "Uso: /orders get|create|update|delete [params]",
    order_created: "Orden creada correctamente.",
    order_updated: "Orden actualizada correctamente.",
    order_deleted: "Orden eliminada correctamente.",
    order_failed: "FallÃ³ el procesamiento de la orden.",
    positions_usage: "Uso: /positions <id> [limit]",
    positions_for: "Posiciones para",
    reports_usage: "Uso: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Tu cuenta de Traccar se ha asociado correctamente con Telegram.",
    miniapp_assoc_title: "Conecta tu cuenta de Traccar",
    miniapp_field_email_phone: "Email o telÃ©fono",
    miniapp_field_password: "ContraseÃ±a",
    miniapp_button_submit: "Conectar cuenta",
    miniapp_error_invalid_request: "Solicitud invÃ¡lida",
    miniapp_error_expired_session: "SesiÃ³n de Telegram expirada. Vuelve a abrir la Mini App.",
    miniapp_error_auth_failed: "Error de autenticaciÃ³n. Verifica tus credenciales.",
    miniapp_error_already_associated: "Esta cuenta ya estÃ¡ asociada a otro usuario de Telegram.",
    miniapp_error_config: "Error de configuraciÃ³n. Contacta al administrador.",
    miniapp_error_rate_limit: "Demasiados intentos. IntÃ©ntalo de nuevo mÃ¡s tarde."
  },
  pt: {
    start_intro: "Comandos disponÃ­veis:",
    start_assoc_prompt:
      "VocÃª nÃ£o estÃ¡ associado a uma conta Traccar. Use /assoc para vincular seu telefone e Telegram.",
    start_commands:
      "/assoc - associar telefone e chat do Telegram (confirmaÃ§Ã£o segura necessÃ¡ria)\n" +
      "/assoc telegram - mostrar botÃ£o de compartilhar contato\n" +
      "/track - listar dispositivos do seu grupo\n" +
      "/track <id> - mostrar localizaÃ§Ã£o e status do dispositivo\n" +
      "/history <id> [n] - Ãºltimas n posiÃ§Ãµes\n" +
      "/status <id> - resumo do dispositivo\n" +
      "/engine <id> on|off - enviar comando de motor (se suportado)\n" +
      "/commands <id> <type> - enviar comando personalizado\n" +
      "/orders get|create|update|delete [params] - gerenciar ordens\n" +
      "/positions <id> [limit] - listar posiÃ§Ãµes recentes\n" +
      "/reports <type> <id> [days] - gerar relatÃ³rio",
    assoc_no_phone:
      'Envie /assoc <telefone_internacional> ou pressione o botÃ£o "Compartilhar contato".',
    assoc_invalid_phone:
      "Telefone invÃ¡lido. Envie /assoc <telefone_internacional> (ex: +5511912345678).",
    assoc_found_and_updated: "OK: ChatID associado Ã  conta: ",
    assoc_no_user_ask_email:
      'Nenhum usuÃ¡rio do Traccar corresponde a este telefone. Envie o email associado Ã  sua conta Traccar para atualizar o perfil, ou envie "cancelar".',
    assoc_email_invalid: 'Email invÃ¡lido. Envie um email vÃ¡lido ou "cancelar".',
    assoc_email_not_found:
      'Nenhum usuÃ¡rio do Traccar encontrado para este email. Verifique e reenvie ou envie "cancelar".',
    assoc_updated_by_email:
      "Perfil atualizado: telefone e ChatID salvos para ",
    assoc_encrypted_required:
      "ConfirmaÃ§Ã£o segura necessÃ¡ria. ForneÃ§a a senha criptografada como segundo argumento: /assoc <telefone> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "ConfirmaÃ§Ã£o falhou: senha criptografada invÃ¡lida ou configuraÃ§Ã£o do servidor ausente.",
    assoc_confirm_success: "AssociaÃ§Ã£o confirmada e salva para ",
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
    cancelled: "OperaÃ§Ã£o cancelada.",
    share_contact_prompt:
      "Compartilhe seu contato para associar sua conta (formato internacional recomendado).",
    miniapp_open_prompt:
      "Toque no botÃ£o abaixo para conectar sua conta do Traccar de forma segura via Telegram Mini App.",
    miniapp_button_open: "Abrir Mini App",
    no_positions: "Nenhuma posiÃ§Ã£o disponÃ­vel.",
    engine_command_sent: "Comando de motor enviado.",
    engine_command_failed: "Falha no comando de motor.",
    commands_usage: "Uso: /commands <deviceId> <commandType>",
    command_sent: "Comando enviado com sucesso.",
    command_failed: "Falha ao enviar comando.",
    orders_usage: "Uso: /orders get|create|update|delete [params]",
    order_created: "Ordem criada com sucesso.",
    order_updated: "Ordem atualizada com sucesso.",
    order_deleted: "Ordem excluÃ­da com sucesso.",
    order_failed: "Falha ao processar ordem.",
    positions_usage: "Uso: /positions <id> [limit]",
    positions_for: "PosiÃ§Ãµes para",
    reports_usage: "Uso: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Sua conta do Traccar foi associada com sucesso ao Telegram.",
    miniapp_assoc_title: "Conecte sua conta do Traccar",
    miniapp_field_email_phone: "Email ou telefone",
    miniapp_field_password: "Senha",
    miniapp_button_submit: "Conectar conta",
    miniapp_error_invalid_request: "SolicitaÃ§Ã£o invÃ¡lida",
    miniapp_error_expired_session: "SessÃ£o do Telegram expirada. Reabra a Mini App.",
    miniapp_error_auth_failed: "Falha na autenticaÃ§Ã£o. Verifique suas credenciais.",
    miniapp_error_already_associated: "Esta conta jÃ¡ estÃ¡ associada a outro usuÃ¡rio do Telegram.",
    miniapp_error_config: "Erro de configuraÃ§Ã£o. Contate o administrador.",
    miniapp_error_rate_limit: "Muitas tentativas. Tente novamente mais tarde."
  },
  tr: {
    start_intro: "KullanÄ±labilir komutlar:",
    start_assoc_prompt:
      "Bir Traccar hesabÄ±yla iliÅŸkilendirilmemiÅŸsiniz. Telefonunuzu ve Telegram'Ä± baÄŸlamak iÃ§in /assoc kullanÄ±n.",
    start_commands:
      "/assoc - telefon ve Telegram chat_id'yi iliÅŸkilendir (gÃ¼venli onay gerekli)\n" +
      "/assoc telegram - kontakt paylaÅŸ butonunu gÃ¶ster\n" +
      "/track - grubunuzdaki cihazlarÄ± listele\n" +
      "/track <id> - cihaz konumunu ve durumunu gÃ¶ster\n" +
      "/history <id> [n] - son n pozisyon\n" +
      "/status <id> - cihaz Ã¶zeti\n" +
      "/engine <id> on|off - motor komutu gÃ¶nder (destekleniyorsa)\n" +
      "/commands <id> <type> - Ã¶zel komut gÃ¶nder\n" +
      "/orders get|create|update|delete [params] - sipariÅŸleri yÃ¶net\n" +
      "/positions <id> [limit] - son pozisyonlarÄ± listele\n" +
      "/reports <type> <id> [days] - rapor oluÅŸtur",
    assoc_no_phone:
      '/assoc <uluslararasÄ±_telefon> gÃ¶nderin veya "KiÅŸiyi PaylaÅŸ" butonuna basÄ±n.',
    assoc_invalid_phone:
      "GeÃ§ersiz telefon. /assoc <uluslararasÄ±_telefon> gÃ¶nderin (Ã¶rn: +905551234567).",
    assoc_found_and_updated: "OK: ChatID hesaba iliÅŸkilendirildi: ",
    assoc_no_user_ask_email:
      "Bu telefonla eÅŸleÅŸen Traccar kullanÄ±cÄ±sÄ± yok. Profilinizi gÃ¼ncellemek iÃ§in Traccar hesabÄ±nÄ±za kayÄ±tlÄ± e-postayÄ± gÃ¶nderin veya 'iptal' yazÄ±n.",
    assoc_email_invalid: 'GeÃ§ersiz e-posta. GeÃ§erli bir e-posta gÃ¶nderin veya "iptal" yazÄ±n.',
    assoc_email_not_found:
      "Bu e-posta iÃ§in Traccar kullanÄ±cÄ±sÄ± bulunamadÄ±. Kontrol edip yeniden gÃ¶nderin veya 'iptal' yazÄ±n.",
    assoc_updated_by_email:
      "Profil gÃ¼ncellendi: telefon ve ChatID kaydedildi: ",
    assoc_encrypted_required:
      "GÃ¼venli onay gerekli. Åžifreli parolayÄ± ikinci argÃ¼man olarak saÄŸlayÄ±n: /assoc <telefon> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "Onay baÅŸarÄ±sÄ±z: geÃ§ersiz ÅŸifreli parola veya sunucu yapÄ±landÄ±rmasÄ± eksik.",
    assoc_confirm_success: "Ä°liÅŸkilendirme onaylandÄ± ve kaydedildi: ",
    track_no_identifier:
      "KullanÄ±m: /track <id> veya grubunuzdaki cihazlarÄ± listelemek iÃ§in /track.",
    track_listing_devices: "Grup cihazlarÄ±:",
    track_device_not_found: "Cihaz bulunamadÄ±: ",
    track_device_info_title: "Cihaz",
    history_usage: "KullanÄ±m: /history <id> [n]",
    status_usage: "KullanÄ±m: /status <id>",
    engine_usage: "KullanÄ±m: /engine <id> on|off",
    generic_error: "Dahili hata. Sunucu gÃ¼nlÃ¼klerine bakÄ±n.",
    cancel: "iptal",
    cancelled: "Ä°ÅŸlem iptal edildi.",
    share_contact_prompt:
      "HesabÄ±nÄ±zÄ± iliÅŸkilendirmek iÃ§in kiÅŸinizi paylaÅŸÄ±n (uluslararasÄ± format Ã¶nerilir).",
    miniapp_open_prompt:
      "AÅŸaÄŸÄ±daki dÃ¼ÄŸmeye basarak Telegram Mini App Ã¼zerinden Traccar hesabÄ±nÄ±zÄ± gÃ¼venli bir ÅŸekilde baÄŸlayÄ±n.",
    miniapp_button_open: "Mini App'i AÃ§",
    no_positions: "Pozisyon verisi yok.",
    engine_command_sent: "Motor komutu gÃ¶nderildi.",
    engine_command_failed: "Motor komutu baÅŸarÄ±sÄ±z.",
    commands_usage: "KullanÄ±m: /commands <deviceId> <commandType>",
    command_sent: "Komut baÅŸarÄ±yla gÃ¶nderildi.",
    command_failed: "Komut gÃ¶nderilemedi.",
    orders_usage: "KullanÄ±m: /orders get|create|update|delete [params]",
    order_created: "SipariÅŸ baÅŸarÄ±yla oluÅŸturuldu.",
    order_updated: "SipariÅŸ baÅŸarÄ±yla gÃ¼ncellendi.",
    order_deleted: "SipariÅŸ baÅŸarÄ±yla silindi.",
    order_failed: "SipariÅŸ iÅŸlenemedi.",
    positions_usage: "KullanÄ±m: /positions <id> [limit]",
    positions_for: "Pozisyonlar: ",
    reports_usage: "KullanÄ±m: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Traccar hesabÄ±nÄ±z Telegram ile baÅŸarÄ±yla iliÅŸkilendirildi.",
    miniapp_assoc_title: "Traccar hesabÄ±nÄ±zÄ± baÄŸlayÄ±n",
    miniapp_field_email_phone: "E-posta veya telefon",
    miniapp_field_password: "Åžifre",
    miniapp_button_submit: "HesabÄ± baÄŸla",
    miniapp_error_invalid_request: "GeÃ§ersiz istek",
    miniapp_error_expired_session: "Telegram oturumu sÃ¼resi doldu. Mini App'i yeniden aÃ§Ä±n.",
    miniapp_error_auth_failed: "Kimlik doÄŸrulama baÅŸarÄ±sÄ±z. Bilgilerinizi kontrol edin.",
    miniapp_error_already_associated: "Bu hesap zaten baÅŸka bir Telegram kullanÄ±cÄ±sÄ±yla iliÅŸkilendirilmiÅŸ.",
    miniapp_error_config: "YapÄ±landÄ±rma hatasÄ±. YÃ¶neticiye baÅŸvurun.",
    miniapp_error_rate_limit: "Ã‡ok fazla deneme. LÃ¼tfen daha sonra tekrar deneyin."
  },
  ru: {
    start_intro: "Ð”Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹Ðµ ÐºÐ¾Ð¼Ð°Ð½Ð´Ñ‹:",
    start_assoc_prompt:
      "Ð’Ñ‹ Ð½Ðµ ÑÐ²ÑÐ·Ð°Ð½Ñ‹ Ñ Ð°ÐºÐºÐ°ÑƒÐ½Ñ‚Ð¾Ð¼ Traccar. Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐ¹Ñ‚Ðµ /assoc Ð´Ð»Ñ Ð¿Ñ€Ð¸Ð²ÑÐ·ÐºÐ¸ Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½Ð° Ð¸ Telegram.",
    start_commands:
      "/assoc - ÑÐ²ÑÐ·Ð°Ñ‚ÑŒ Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½ Ð¸ chat_id Telegram (Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ÑÑ Ð±ÐµÐ·Ð¾Ð¿Ð°ÑÐ½Ð¾Ðµ Ð¿Ð¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´ÐµÐ½Ð¸Ðµ)\n" +
      "/assoc telegram - Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ ÐºÐ½Ð¾Ð¿ÐºÑƒ Ð¾Ð±Ð¼ÐµÐ½Ð° ÐºÐ¾Ð½Ñ‚Ð°ÐºÑ‚Ð¾Ð¼\n" +
      "/track - ÑÐ¿Ð¸ÑÐ¾Ðº ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð² Ð² Ð²Ð°ÑˆÐµÐ¹ Ð³Ñ€ÑƒÐ¿Ð¿Ðµ\n" +
      "/track <id> - Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ Ð¼ÐµÑÑ‚Ð¾Ð¿Ð¾Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ Ð¸ ÑÑ‚Ð°Ñ‚ÑƒÑ ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ð°\n" +
      "/history <id> [n] - Ð¿Ð¾ÑÐ»ÐµÐ´Ð½Ð¸Ðµ n Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ð¹\n" +
      "/status <id> - ÑÐ²Ð¾Ð´ÐºÐ° Ð¿Ð¾ ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ñƒ\n" +
      "/engine <id> on|off - Ð¾Ñ‚Ð¿Ñ€Ð°Ð²Ð¸Ñ‚ÑŒ ÐºÐ¾Ð¼Ð°Ð½Ð´Ñƒ Ð´Ð²Ð¸Ð³Ð°Ñ‚ÐµÐ»Ñ (ÐµÑÐ»Ð¸ Ð¿Ð¾Ð´Ð´ÐµÑ€Ð¶Ð¸Ð²Ð°ÐµÑ‚ÑÑ)\n" +
      "/commands <id> <type> - Ð¾Ñ‚Ð¿Ñ€Ð°Ð²Ð¸Ñ‚ÑŒ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÑÐºÑƒÑŽ ÐºÐ¾Ð¼Ð°Ð½Ð´Ñƒ\n" +
      "/orders get|create|update|delete [params] - ÑƒÐ¿Ñ€Ð°Ð²Ð»ÑÑ‚ÑŒ Ð·Ð°ÐºÐ°Ð·Ð°Ð¼Ð¸\n" +
      "/positions <id> [limit] - ÑÐ¿Ð¸ÑÐ¾Ðº Ð¿Ð¾ÑÐ»ÐµÐ´Ð½Ð¸Ñ… Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ð¹\n" +
      "/reports <type> <id> [days] - ÑÐ³ÐµÐ½ÐµÑ€Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð¾Ñ‚Ñ‡ÐµÑ‚",
    assoc_no_phone:
      'ÐžÑ‚Ð¿Ñ€Ð°Ð²ÑŒÑ‚Ðµ /assoc <Ð¼ÐµÐ¶Ð´ÑƒÐ½Ð°Ñ€Ð¾Ð´Ð½Ñ‹Ð¹_Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½> Ð¸Ð»Ð¸ Ð½Ð°Ð¶Ð¼Ð¸Ñ‚Ðµ ÐºÐ½Ð¾Ð¿ÐºÑƒ "ÐŸÐ¾Ð´ÐµÐ»Ð¸Ñ‚ÑŒÑÑ ÐºÐ¾Ð½Ñ‚Ð°ÐºÑ‚Ð¾Ð¼".',
    assoc_invalid_phone:
      "ÐÐµÐ²ÐµÑ€Ð½Ñ‹Ð¹ Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½. ÐžÑ‚Ð¿Ñ€Ð°Ð²ÑŒÑ‚Ðµ /assoc <Ð¼ÐµÐ¶Ð´ÑƒÐ½Ð°Ñ€Ð¾Ð´Ð½Ñ‹Ð¹_Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½> (Ð½Ð°Ð¿Ñ€. +79123456789).",
    assoc_found_and_updated: "OK: ChatID Ð¿Ñ€Ð¸Ð²ÑÐ·Ð°Ð½ Ðº Ð°ÐºÐºÐ°ÑƒÐ½Ñ‚Ñƒ: ",
    assoc_no_user_ask_email:
      "ÐÐ¸ Ð¾Ð´Ð¸Ð½ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Traccar Ð½Ðµ ÑÐ¾Ð¾Ñ‚Ð²ÐµÑ‚ÑÑ‚Ð²ÑƒÐµÑ‚ ÑÑ‚Ð¾Ð¼Ñƒ Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½Ñƒ. ÐžÑ‚Ð¿Ñ€Ð°Ð²ÑŒÑ‚Ðµ email, Ð¿Ñ€Ð¸Ð²ÑÐ·Ð°Ð½Ð½Ñ‹Ð¹ Ðº Ð²Ð°ÑˆÐµÐ¼Ñƒ Ð°ÐºÐºÐ°ÑƒÐ½Ñ‚Ñƒ Traccar, Ð´Ð»Ñ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ Ð¿Ñ€Ð¾Ñ„Ð¸Ð»Ñ, Ð¸Ð»Ð¸ Ð¾Ñ‚Ð¿Ñ€Ð°Ð²ÑŒÑ‚Ðµ \"Ð¾Ñ‚Ð¼ÐµÐ½Ð°\".",
    assoc_email_invalid: 'ÐÐµÐ²ÐµÑ€Ð½Ñ‹Ð¹ email. ÐžÑ‚Ð¿Ñ€Ð°Ð²ÑŒÑ‚Ðµ ÐºÐ¾Ñ€Ñ€ÐµÐºÑ‚Ð½Ñ‹Ð¹ email Ð¸Ð»Ð¸ "Ð¾Ñ‚Ð¼ÐµÐ½Ð°".',
    assoc_email_not_found:
      "ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Traccar Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½ Ð´Ð»Ñ ÑÑ‚Ð¾Ð³Ð¾ email. ÐŸÑ€Ð¾Ð²ÐµÑ€ÑŒÑ‚Ðµ Ð¸ Ð¾Ñ‚Ð¿Ñ€Ð°Ð²ÑŒÑ‚Ðµ ÑÐ½Ð¾Ð²Ð° Ð¸Ð»Ð¸ \"Ð¾Ñ‚Ð¼ÐµÐ½Ð°\".",
    assoc_updated_by_email:
      "ÐŸÑ€Ð¾Ñ„Ð¸Ð»ÑŒ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½: Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½ Ð¸ ChatID ÑÐ¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ñ‹ Ð´Ð»Ñ ",
    assoc_encrypted_required:
      "Ð¢Ñ€ÐµÐ±ÑƒÐµÑ‚ÑÑ Ð±ÐµÐ·Ð¾Ð¿Ð°ÑÐ½Ð¾Ðµ Ð¿Ð¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´ÐµÐ½Ð¸Ðµ. Ð£ÐºÐ°Ð¶Ð¸Ñ‚Ðµ Ð·Ð°ÑˆÐ¸Ñ„Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ð¹ Ð¿Ð°Ñ€Ð¾Ð»ÑŒ Ð²Ñ‚Ð¾Ñ€Ñ‹Ð¼ Ð°Ñ€Ð³ÑƒÐ¼ÐµÐ½Ñ‚Ð¾Ð¼: /assoc <Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½> <encryptedPasswordBase64>",
    assoc_confirm_failed:
      "ÐŸÐ¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´ÐµÐ½Ð¸Ðµ Ð½Ðµ ÑƒÐ´Ð°Ð»Ð¾ÑÑŒ: Ð½ÐµÐ²ÐµÑ€Ð½Ñ‹Ð¹ Ð·Ð°ÑˆÐ¸Ñ„Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ð¹ Ð¿Ð°Ñ€Ð¾Ð»ÑŒ Ð¸Ð»Ð¸ Ð¾Ñ‚ÑÑƒÑ‚ÑÑ‚Ð²ÑƒÐµÑ‚ ÐºÐ¾Ð½Ñ„Ð¸Ð³ÑƒÑ€Ð°Ñ†Ð¸Ñ ÑÐµÑ€Ð²ÐµÑ€Ð°.",
    assoc_confirm_success: "Ð¡Ð²ÑÐ·ÑŒ Ð¿Ð¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´ÐµÐ½Ð° Ð¸ ÑÐ¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ð° Ð´Ð»Ñ ",
    track_no_identifier:
      "Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ðµ: /track <id> Ð¸Ð»Ð¸ /track Ð´Ð»Ñ ÑÐ¿Ð¸ÑÐºÐ° ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð² Ð²Ð°ÑˆÐµÐ¹ Ð³Ñ€ÑƒÐ¿Ð¿Ñ‹.",
    track_listing_devices: "Ð£ÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ð° Ð² Ð²Ð°ÑˆÐµÐ¹ Ð³Ñ€ÑƒÐ¿Ð¿Ðµ:",
    track_device_not_found: "Ð£ÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ð¾ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾ Ð´Ð»Ñ ",
    track_device_info_title: "Ð£ÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ð¾",
    history_usage: "Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ðµ: /history <id> [n]",
    status_usage: "Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ðµ: /status <id>",
    engine_usage: "Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ðµ: /engine <id> on|off",
    generic_error: "Ð’Ð½ÑƒÑ‚Ñ€ÐµÐ½Ð½ÑÑ Ð¾ÑˆÐ¸Ð±ÐºÐ°. Ð¡Ð¼Ð¾Ñ‚Ñ€Ð¸Ñ‚Ðµ Ð»Ð¾Ð³Ð¸ ÑÐµÑ€Ð²ÐµÑ€Ð°.",
    cancel: "Ð¾Ñ‚Ð¼ÐµÐ½Ð°",
    cancelled: "ÐžÐ¿ÐµÑ€Ð°Ñ†Ð¸Ñ Ð¾Ñ‚Ð¼ÐµÐ½ÐµÐ½Ð°.",
    share_contact_prompt:
      "ÐŸÐ¾Ð´ÐµÐ»Ð¸Ñ‚ÐµÑÑŒ ÐºÐ¾Ð½Ñ‚Ð°ÐºÑ‚Ð¾Ð¼ Ð´Ð»Ñ Ð¿Ñ€Ð¸Ð²ÑÐ·ÐºÐ¸ Ð°ÐºÐºÐ°ÑƒÐ½Ñ‚Ð° (Ñ€ÐµÐºÐ¾Ð¼ÐµÐ½Ð´ÑƒÐµÑ‚ÑÑ Ð¼ÐµÐ¶Ð´ÑƒÐ½Ð°Ñ€Ð¾Ð´Ð½Ñ‹Ð¹ Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚).",
    miniapp_open_prompt:
      "ÐÐ°Ð¶Ð¼Ð¸Ñ‚Ðµ ÐºÐ½Ð¾Ð¿ÐºÑƒ Ð½Ð¸Ð¶Ðµ, Ñ‡Ñ‚Ð¾Ð±Ñ‹ Ð±ÐµÐ·Ð¾Ð¿Ð°ÑÐ½Ð¾ Ð¿Ð¾Ð´ÐºÐ»ÑŽÑ‡Ð¸Ñ‚ÑŒ Ð²Ð°Ñˆ Ð°ÐºÐºÐ°ÑƒÐ½Ñ‚ Traccar Ñ‡ÐµÑ€ÐµÐ· Telegram Mini App.",
    miniapp_button_open: "ÐžÑ‚ÐºÑ€Ñ‹Ñ‚ÑŒ Mini App",
    no_positions: "ÐŸÐ¾Ð·Ð¸Ñ†Ð¸Ð¹ Ð½ÐµÑ‚.",
    engine_command_sent: "ÐšÐ¾Ð¼Ð°Ð½Ð´Ð° Ð´Ð²Ð¸Ð³Ð°Ñ‚ÐµÐ»Ñ Ð¾Ñ‚Ð¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð°.",
    engine_command_failed: "ÐžÑˆÐ¸Ð±ÐºÐ° ÐºÐ¾Ð¼Ð°Ð½Ð´Ñ‹ Ð´Ð²Ð¸Ð³Ð°Ñ‚ÐµÐ»Ñ.",
    commands_usage: "Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ðµ: /commands <deviceId> <commandType>",
    command_sent: "ÐšÐ¾Ð¼Ð°Ð½Ð´Ð° ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ Ð¾Ñ‚Ð¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð°.",
    command_failed: "ÐÐµ ÑƒÐ´Ð°Ð»Ð¾ÑÑŒ Ð¾Ñ‚Ð¿Ñ€Ð°Ð²Ð¸Ñ‚ÑŒ ÐºÐ¾Ð¼Ð°Ð½Ð´Ñƒ.",
    orders_usage: "Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ðµ: /orders get|create|update|delete [params]",
    order_created: "Ð—Ð°ÐºÐ°Ð· ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ ÑÐ¾Ð·Ð´Ð°Ð½.",
    order_updated: "Ð—Ð°ÐºÐ°Ð· ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½.",
    order_deleted: "Ð—Ð°ÐºÐ°Ð· ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ ÑƒÐ´Ð°Ð»ÐµÐ½.",
    order_failed: "ÐÐµ ÑƒÐ´Ð°Ð»Ð¾ÑÑŒ Ð¾Ð±Ñ€Ð°Ð±Ð¾Ñ‚Ð°Ñ‚ÑŒ Ð·Ð°ÐºÐ°Ð·.",
    positions_usage: "Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ðµ: /positions <id> [limit]",
    positions_for: "ÐŸÐ¾Ð·Ð¸Ñ†Ð¸Ð¸ Ð´Ð»Ñ",
    reports_usage: "Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ðµ: /reports <type> <id> [days]\nTypes: route, events, geofences, summary, trips, stops",
    miniapp_assoc_success: "Ð’Ð°Ñˆ Ð°ÐºÐºÐ°ÑƒÐ½Ñ‚ Traccar ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ ÑÐ²ÑÐ·Ð°Ð½ Ñ Telegram.",
    miniapp_assoc_title: "ÐŸÐ¾Ð´ÐºÐ»ÑŽÑ‡Ð¸Ñ‚Ðµ Ð²Ð°Ñˆ Ð°ÐºÐºÐ°ÑƒÐ½Ñ‚ Traccar",
    miniapp_field_email_phone: "Email Ð¸Ð»Ð¸ Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½",
    miniapp_field_password: "ÐŸÐ°Ñ€Ð¾Ð»ÑŒ",
    miniapp_button_submit: "ÐŸÐ¾Ð´ÐºÐ»ÑŽÑ‡Ð¸Ñ‚ÑŒ Ð°ÐºÐºÐ°ÑƒÐ½Ñ‚",
    miniapp_error_invalid_request: "ÐÐµÐ²ÐµÑ€Ð½Ñ‹Ð¹ Ð·Ð°Ð¿Ñ€Ð¾Ñ",
    miniapp_error_expired_session: "Ð¡ÐµÑÑÐ¸Ñ Telegram Ð¸ÑÑ‚ÐµÐºÐ»Ð°. ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð¾Ñ‚ÐºÑ€Ð¾Ð¹Ñ‚Ðµ Mini App ÑÐ½Ð¾Ð²Ð°.",
    miniapp_error_auth_failed: "ÐžÑˆÐ¸Ð±ÐºÐ° Ð°ÑƒÑ‚ÐµÐ½Ñ‚Ð¸Ñ„Ð¸ÐºÐ°Ñ†Ð¸Ð¸. ÐŸÑ€Ð¾Ð²ÐµÑ€ÑŒÑ‚Ðµ Ð²Ð°ÑˆÐ¸ ÑƒÑ‡ÐµÑ‚Ð½Ñ‹Ðµ Ð´Ð°Ð½Ð½Ñ‹Ðµ.",
    miniapp_error_already_associated: "Ð­Ñ‚Ð¾Ñ‚ Ð°ÐºÐºÐ°ÑƒÐ½Ñ‚ ÑƒÐ¶Ðµ ÑÐ²ÑÐ·Ð°Ð½ Ñ Ð´Ñ€ÑƒÐ³Ð¸Ð¼ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÐµÐ¼ Telegram.",
    miniapp_error_config: "ÐžÑˆÐ¸Ð±ÐºÐ° ÐºÐ¾Ð½Ñ„Ð¸Ð³ÑƒÑ€Ð°Ñ†Ð¸Ð¸. ÐžÐ±Ñ€Ð°Ñ‚Ð¸Ñ‚ÐµÑÑŒ Ðº Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€Ñƒ.",
    miniapp_error_rate_limit: "Ð¡Ð»Ð¸ÑˆÐºÐ¾Ð¼ Ð¼Ð½Ð¾Ð³Ð¾ Ð¿Ð¾Ð¿Ñ‹Ñ‚Ð¾Ðº. ÐŸÐ¾Ð¿Ñ€Ð¾Ð±ÑƒÐ¹Ñ‚Ðµ Ð¿Ð¾Ð·Ð¶Ðµ."
  }
};
