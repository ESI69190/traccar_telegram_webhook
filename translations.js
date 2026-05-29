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
      "/engine <id> on|off - send engine command (if supported)",
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
    assoc_updated_by_email: "Profile updated: phone and ChatID saved for ",
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
    engine_command_failed: "Engine command failed."
  },
  fr: {
    start_intro: "Commandes disponibles :",
    start_assoc_prompt:
      "Vous n êtes pas associé à un compte Traccar. Utilisez /assoc pour lier votre téléphone et Telegram.",
    start_commands:
      "/assoc - associer numéro et chat Telegram (confirmation sécurisée requise)\n" +
      "/assoc telegram - afficher le bouton de partage de contact\n" +
      "/track - lister les équipements du groupe\n" +
      "/track <id> - afficher la position et l état d un équipement\n" +
      "/history <id> [n] - dernières positions\n" +
      "/status <id> - résumé de l équipement\n" +
      "/engine <id> on|off - envoyer commande moteur (si supporté)",
    assoc_no_phone:
      'Envoyez /assoc <numero_international> ou appuyez sur le bouton "Partager mon contact".',
    assoc_invalid_phone:
      "Numéro invalide. Envoyez /assoc <numero_international> (ex: +33123456789).",
    assoc_found_and_updated: "OK : ChatID associé au compte : ",
    assoc_no_user_ask_email:
      'Aucun utilisateur Traccar ne correspond à ce numéro. Envoyez l adresse email associée à votre compte Traccar pour que je mette à jour le profil, ou envoyez "annuler".',
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
    engine_command_failed: "Échec de la commande moteur."
  }
};
