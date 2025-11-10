"""
Modification pour ajouter la colonne 'email' aux insertions dans les tables de tracking
À intégrer dans votre backend Flask existant

IMPORTANT: Remplacez TOUTES vos insertions dans email_info, email_pub, et email_traite
par ces versions qui incluent la colonne 'email'
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import logging

logger = logging.getLogger(__name__)


def insert_email_info_with_email(conn, user_id, message_id, email_address, subject=None,
                                  sender=None, body=None, received_date=None):
    """
    Insert dans email_info avec la colonne email pour auto-assignation de email_account_id

    Args:
        conn: Connexion PostgreSQL
        user_id: UUID de l'utilisateur
        message_id: ID unique du message
        email_address: Adresse email du compte (soumareramaba@gmail.com, rama@hallia.ai, etc.)
        subject: Sujet de l'email (optionnel)
        sender: Expéditeur (optionnel)
        body: Corps de l'email (optionnel)
        received_date: Date de réception (optionnel)
    """
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO email_info
            (user_id, message_id, email, subject, sender, body, received_date, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id, email_account_id
        """, (user_id, message_id, email_address, subject, sender, body, received_date))

        result = cursor.fetchone()
        conn.commit()

        logger.info(f"Email info inserted: id={result[0]}, email_account_id={result[1]}, email={email_address}")
        return result[0]

    except Exception as e:
        conn.rollback()
        logger.error(f"Erreur insertion email_info: {e}")
        raise


def insert_email_pub_with_email(conn, user_id, message_id, email_address, subject=None,
                                 sender=None, body=None, received_date=None):
    """
    Insert dans email_pub avec la colonne email

    Args:
        conn: Connexion PostgreSQL
        user_id: UUID de l'utilisateur
        message_id: ID unique du message
        email_address: Adresse email du compte
        subject: Sujet de l'email (optionnel)
        sender: Expéditeur (optionnel)
        body: Corps de l'email (optionnel)
        received_date: Date de réception (optionnel)
    """
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO email_pub
            (user_id, message_id, email, subject, sender, body, received_date, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id, email_account_id
        """, (user_id, message_id, email_address, subject, sender, body, received_date))

        result = cursor.fetchone()
        conn.commit()

        logger.info(f"Email pub inserted: id={result[0]}, email_account_id={result[1]}, email={email_address}")
        return result[0]

    except Exception as e:
        conn.rollback()
        logger.error(f"Erreur insertion email_pub: {e}")
        raise


def insert_email_traite_with_email(conn, user_id, message_id, email_address, subject=None,
                                    sender=None, body=None, received_date=None,
                                    response_sent=False):
    """
    Insert dans email_traite avec la colonne email

    Args:
        conn: Connexion PostgreSQL
        user_id: UUID de l'utilisateur
        message_id: ID unique du message
        email_address: Adresse email du compte
        subject: Sujet de l'email (optionnel)
        sender: Expéditeur (optionnel)
        body: Corps de l'email (optionnel)
        received_date: Date de réception (optionnel)
        response_sent: Si une réponse a été envoyée (optionnel)
    """
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO email_traite
            (user_id, message_id, email, subject, sender, body, received_date,
             response_sent, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id, email_account_id
        """, (user_id, message_id, email_address, subject, sender, body, received_date,
              response_sent))

        result = cursor.fetchone()
        conn.commit()

        logger.info(f"Email traite inserted: id={result[0]}, email_account_id={result[1]}, email={email_address}")
        return result[0]

    except Exception as e:
        conn.rollback()
        logger.error(f"Erreur insertion email_traite: {e}")
        raise


# ============================================================================
# EXEMPLE D'INTÉGRATION DANS VOS ENDPOINTS
# ============================================================================

from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/poll-emails', methods=['POST'])
def poll_emails():
    """
    Endpoint /poll-emails avec support de la colonne email

    Body attendu:
    {
        "email": "soumareramaba@gmail.com",  // <-- IMPORTANT: email du compte
        "password": "...",
        "imapServer": "imap.gmail.com",
        "userId": "09af7f06-cc6e-4b31-9b49-bb805f1b8d88"  // <-- Ajouter userId
    }
    """
    data = request.json

    if not data or 'email' not in data:
        return jsonify({"error": "Missing email"}), 400

    email_address = data['email']  # L'adresse email du compte
    password = data.get('password')
    imap_server = data.get('imapServer')
    user_id = data.get('userId')  # Vous devez passer le user_id

    if not user_id:
        return jsonify({"error": "Missing userId"}), 400

    try:
        # 1. Connexion IMAP (votre code existant)
        # mail = connect_imap(...)

        # 2. Récupération des emails (votre code existant)
        # messages = ...

        # 3. Pour chaque email récupéré, insertion avec la colonne email
        conn = get_db_connection()  # Votre fonction de connexion DB

        # Exemple d'insertion
        for msg_id, email_data in emails_retrieved.items():

            # Catégorisation de l'email (votre logique existante)
            category = categorize_email(email_data)

            if category == 'info':
                insert_email_info_with_email(
                    conn=conn,
                    user_id=user_id,
                    message_id=msg_id,
                    email_address=email_address,  # <-- IMPORTANT: passer l'email
                    subject=email_data.get('subject'),
                    sender=email_data.get('sender'),
                    body=email_data.get('body'),
                    received_date=email_data.get('date')
                )

            elif category == 'pub':
                insert_email_pub_with_email(
                    conn=conn,
                    user_id=user_id,
                    message_id=msg_id,
                    email_address=email_address,  # <-- IMPORTANT
                    subject=email_data.get('subject'),
                    sender=email_data.get('sender'),
                    body=email_data.get('body'),
                    received_date=email_data.get('date')
                )

            else:  # traité
                insert_email_traite_with_email(
                    conn=conn,
                    user_id=user_id,
                    message_id=msg_id,
                    email_address=email_address,  # <-- IMPORTANT
                    subject=email_data.get('subject'),
                    sender=email_data.get('sender'),
                    body=email_data.get('body'),
                    received_date=email_data.get('date')
                )

        conn.close()

        return jsonify({
            "status": "success",
            "count": len(emails_retrieved),
            "email_account": email_address
        })

    except Exception as e:
        logger.error(f"Erreur dans poll-emails: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/unread-emails', methods=['POST'])
def unread_emails():
    """
    Endpoint /unread-emails avec support de la colonne email

    Body attendu:
    {
        "email": "rama@hallia.ai",  // <-- IMPORTANT: email du compte
        "refreshToken": "...",
        "provider": "outlook",
        "imapServer": "...",
        "userId": "09af7f06-cc6e-4b31-9b49-bb805f1b8d88"  // <-- Ajouter userId
    }
    """
    data = request.json

    if not data or 'email' not in data:
        return jsonify({"error": "Missing email"}), 400

    email_address = data['email']  # L'adresse email du compte
    refresh_token = data.get('refreshToken')
    provider = data.get('provider')
    user_id = data.get('userId')

    if not user_id:
        return jsonify({"error": "Missing userId"}), 400

    try:
        # Votre logique existante pour récupérer les emails
        # ...

        # Lors de l'insertion, TOUJOURS passer email_address
        conn = get_db_connection()

        for msg_id, email_data in emails_retrieved.items():
            category = categorize_email(email_data)

            if category == 'info':
                insert_email_info_with_email(
                    conn, user_id, msg_id, email_address,  # <-- email_address
                    email_data.get('subject'), email_data.get('sender'),
                    email_data.get('body'), email_data.get('date')
                )
            # ... même chose pour pub et traite

        conn.close()

        return jsonify({
            "status": "success",
            "count": len(emails_retrieved),
            "email_account": email_address
        })

    except Exception as e:
        logger.error(f"Erreur dans unread-emails: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================================================
# RÉSUMÉ DES MODIFICATIONS À FAIRE DANS VOTRE BACKEND
# ============================================================================
"""
1. Dans /poll-emails:
   - Récupérer data['email'] (l'adresse email)
   - Passer email_address à toutes vos fonctions d'insertion

2. Dans /unread-emails:
   - Récupérer data['email'] (l'adresse email)
   - Passer email_address à toutes vos fonctions d'insertion

3. Modifier TOUTES vos insertions SQL pour inclure la colonne 'email':

   AVANT:
   INSERT INTO email_info (user_id, message_id, created_at)
   VALUES (%s, %s, NOW())

   APRÈS:
   INSERT INTO email_info (user_id, message_id, email, created_at)
   VALUES (%s, %s, %s, NOW())

4. Le trigger PostgreSQL fera automatiquement le matching:
   - Si email = 'soumareramaba@gmail.com' → email_account_id Gmail
   - Si email = 'rama@hallia.ai' → email_account_id SMTP
   - Et ainsi de suite pour tous les comptes configurés

AUCUNE AUTRE MODIFICATION N'EST NÉCESSAIRE !
Le trigger gère tout automatiquement côté base de données.
"""
