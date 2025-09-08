import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TranslationDictionary {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = new BehaviorSubject<string>('en');
  private translations: { [language: string]: TranslationDictionary } = {
    en: {
      // Common
      'welcome': 'Welcome',
      'login': 'Login',
      'logout': 'Logout',
      'register': 'Register',
      'email': 'Email',
      'password': 'Password',
      'loading': 'Loading',
      'error': 'Error',
      'success': 'Success',
      'save': 'Save',
      'cancel': 'Cancel',
      'confirm': 'Confirm',
      'delete': 'Delete',
      'edit': 'Edit',
      'view': 'View',
      'back': 'Back',
      'next': 'Next',
      'previous': 'Previous',
      'submit': 'Submit',
      'search': 'Search',
      'filter': 'Filter',
      'sort': 'Sort',
      'try_again': 'Try Again',
      
      // Login page
      'welcome_back': 'Welcome Back',
      'enter_email': 'Enter your email',
      'enter_password': 'Enter your password',
      'logging_in': 'Logging in...',
      'dont_have_account': 'Don\'t have an account?',
      'register_here': 'Register here',
      'login_failed': 'Login failed. Please try again.',
      'failed_load_services': 'Failed to load services. Please try again later.',
      
      // Home page
      'welcome_to_servicehub': 'Welcome to ServiceHub',
      'choose_services': 'Choose from our available services to get started',
      'loading_services': 'Loading services...',
      'no_services_available': 'No services available',
      'check_back_later': 'Please check back later for available services.',
      'from': 'From',
      'per_mile_over': '/mile over 100 miles',
      'select_service': 'Select Service',
      'professional_service': 'Professional service available',
      
      // Service details
      'service_details': 'Service Details',
      'base_price': 'Base Price',
      'request_service': 'Request Service',
      'no_description': 'No description available.',
      
      // Admin dashboard
      'admin_dashboard': 'Admin Dashboard',
      'conversations': 'Conversations',
      'services_management': 'Services Management',
      'workers_management': 'Workers Management',
      'add_service': 'Add Service',
      'add_worker': 'Add Worker',
      'name': 'Name',
      'description': 'Description',
      'phone': 'Phone',
      'vehicle_type': 'Vehicle Type',
      'vehicle_plate': 'Vehicle Plate',
      'delete_confirmation': 'Are you sure you want to delete this?',
      
      // Chat
      'chat_support': 'Chat Support',
      'send_message': 'Send Message',
      'type_message': 'Type your message...',
      
      // Delivery tracking
      'delivery_tracking': 'Delivery Tracking',
      'tracking_status': 'Tracking Status',
      'current_location': 'Current Location',
      'estimated_arrival': 'Estimated Arrival',
      
      // Driver profile
      'driver_profile': 'Driver Profile',
      'ratings': 'Ratings',
      'reviews': 'Reviews',
      'completed_deliveries': 'Completed Deliveries'
    },
    es: {
      // Common
      'welcome': 'Bienvenido',
      'login': 'Iniciar sesión',
      'logout': 'Cerrar sesión',
      'register': 'Registrarse',
      'email': 'Correo electrónico',
      'password': 'Contraseña',
      'loading': 'Cargando',
      'error': 'Error',
      'success': 'Éxito',
      'save': 'Guardar',
      'cancel': 'Cancelar',
      'confirm': 'Confirmar',
      'delete': 'Eliminar',
      'edit': 'Editar',
      'view': 'Ver',
      'back': 'Atrás',
      'next': 'Siguiente',
      'previous': 'Anterior',
      'submit': 'Enviar',
      'search': 'Buscar',
      'filter': 'Filtrar',
      'sort': 'Ordenar',
      
      // Login page
      'welcome_back': 'Bienvenido de nuevo',
      'enter_email': 'Ingresa tu correo electrónico',
      'enter_password': 'Ingresa tu contraseña',
      'logging_in': 'Iniciando sesión...',
      'dont_have_account': '¿No tienes una cuenta?',
      'register_here': 'Regístrate aquí',
      'login_failed': 'Error al iniciar sesión. Por favor, intenta de nuevo.',
      'failed_load_services': 'Error al cargar los servicios. Por favor, intente de nuevo más tarde.',
      
      // Home page
      'welcome_to_servicehub': 'Bienvenido a ServiceHub',
      'choose_services': 'Elige entre nuestros servicios disponibles para comenzar',
      'loading_services': 'Cargando servicios...',
      'no_services_available': 'No hay servicios disponibles',
      'check_back_later': 'Por favor, vuelve más tarde para ver los servicios disponibles.',
      'from': 'Desde',
      'per_mile_over': '/milla por encima de 100 millas',
      'select_service': 'Seleccionar Servicio',
      'professional_service': 'Servicio profesional disponible',
      
      // Service details
      'service_details': 'Detalles del Servicio',
      'base_price': 'Precio Base',
      'request_service': 'Solicitar Servicio',
      'no_description': 'No hay descripción disponible.',
      
      // Admin dashboard
      'admin_dashboard': 'Panel de Administración',
      'conversations': 'Conversaciones',
      'services_management': 'Gestión de Servicios',
      'workers_management': 'Gestión de Trabajadores',
      'add_service': 'Agregar Servicio',
      'add_worker': 'Agregar Trabajador',
      'name': 'Nombre',
      'description': 'Descripción',
      'phone': 'Teléfono',
      'vehicle_type': 'Tipo de Vehículo',
      'vehicle_plate': 'Placa del Vehículo',
      'delete_confirmation': '¿Estás seguro de que quieres eliminar esto?',
      
      // Chat
      'chat_support': 'Soporte de Chat',
      'send_message': 'Enviar Mensaje',
      'type_message': 'Escribe tu mensaje...',
      
      // Delivery tracking
      'delivery_tracking': 'Seguimiento de Entrega',
      'tracking_status': 'Estado de Seguimiento',
      'current_location': 'Ubicación Actual',
      'estimated_arrival': 'Llegada Estimada',
      
      // Driver profile
      'driver_profile': 'Perfil del Conductor',
      'ratings': 'Calificaciones',
      'reviews': 'Reseñas',
      'completed_deliveries': 'Entregas Completadas'
    },
    fr: {
      // Common
      'welcome': 'Bienvenue',
      'login': 'Connexion',
      'logout': 'Déconnexion',
      'register': 'S\'inscrire',
      'email': 'Email',
      'password': 'Mot de passe',
      'loading': 'Chargement',
      'error': 'Erreur',
      'success': 'Succès',
      'save': 'Enregistrer',
      'cancel': 'Annuler',
      'confirm': 'Confirmer',
      'delete': 'Supprimer',
      'edit': 'Modifier',
      'view': 'Voir',
      'back': 'Retour',
      'next': 'Suivant',
      'previous': 'Précédent',
      'submit': 'Soumettre',
      'search': 'Rechercher',
      'filter': 'Filtrer',
      'sort': 'Trier',
      
      // Login page
      'welcome_back': 'Bon retour',
      'enter_email': 'Entrez votre email',
      'enter_password': 'Entrez votre mot de passe',
      'logging_in': 'Connexion en cours...',
      'dont_have_account': 'Vous n\'avez pas de compte ?',
      'register_here': 'Inscrivez-vous ici',
      'login_failed': 'Échec de la connexion. Veuillez réessayer.',
      'failed_load_services': 'Échec du chargement des services. Veuillez réessayer plus tard.',
      
      // Home page
      'welcome_to_servicehub': 'Bienvenue sur ServiceHub',
      'choose_services': 'Choisissez parmi nos services disponibles pour commencer',
      'loading_services': 'Chargement des services...',
      'no_services_available': 'Aucun service disponible',
      'check_back_later': 'Veuillez revenir plus tard pour les services disponibles.',
      'from': 'À partir de',
      'per_mile_over': '/mile au-dessus de 100 miles',
      'select_service': 'Sélectionner le Service',
      'professional_service': 'Service professionnel disponible',
      
      // Service details
      'service_details': 'Détails du Service',
      'base_price': 'Prix de Base',
      'request_service': 'Demander le Service',
      'no_description': 'Aucune description disponible.',
      
      // Admin dashboard
      'admin_dashboard': 'Tableau de Bord Administratif',
      'conversations': 'Conversations',
      'services_management': 'Gestion des Services',
      'workers_management': 'Gestion des Travailleurs',
      'add_service': 'Ajouter un Service',
      'add_worker': 'Ajouter un Travailleur',
      'name': 'Nom',
      'description': 'Description',
      'phone': 'Téléphone',
      'vehicle_type': 'Type de Véhicule',
      'vehicle_plate': 'Plaque d\'Immatriculation',
      'delete_confirmation': 'Êtes-vous sûr de vouloir supprimer cela ?',
      
      // Chat
      'chat_support': 'Support Chat',
      'send_message': 'Envoyer un Message',
      'type_message': 'Tapez votre message...',
      
      // Delivery tracking
      'delivery_tracking': 'Suivi de Livraison',
      'tracking_status': 'Statut de Suivi',
      'current_location': 'Emplacement Actuel',
      'estimated_arrival': 'Arrivée Estimée',
      
      // Driver profile
      'driver_profile': 'Profil du Conducteur',
      'ratings': 'Évaluations',
      'reviews': 'Avis',
      'completed_deliveries': 'Livraisons Terminées'
    }
  };

  constructor() {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && this.translations[savedLanguage]) {
      this.currentLanguage.next(savedLanguage);
    }
  }

  setLanguage(languageCode: string): void {
    if (this.translations[languageCode]) {
      this.currentLanguage.next(languageCode);
      localStorage.setItem('preferredLanguage', languageCode);
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage.value;
  }

  translate(key: string, params?: { [key: string]: string }): string {
    const translation = this.translations[this.currentLanguage.value]?.[key] || key;
    
    if (params) {
      return this.replaceParams(translation, params);
    }
    
    return translation;
  }

  private replaceParams(text: string, params: { [key: string]: string }): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
      return params[paramName] || match;
    });
  }

  getAvailableLanguages(): string[] {
    return Object.keys(this.translations);
  }

  // Observable for language changes
  getLanguageChanges() {
    return this.currentLanguage.asObservable();
  }
}
