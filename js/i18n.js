/* ============================================================
   Souk10 — i18n.js : traductions AR / FR + bascule RTL/LTR
   ============================================================ */
'use strict';

const I18N = {
  lang: localStorage.getItem('souk10_lang') || 'ar',

  dict: {
    /* ===== Général / Navigation ===== */
    brand_tag:        { ar: 'السوق ديالك أونلاين', fr: 'Votre marché en ligne' },
    nav_home:         { ar: 'الرئيسية', fr: 'Accueil' },
    nav_publish:      { ar: 'نشر إعلان', fr: 'Publier' },
    nav_my_listings:  { ar: 'إعلاناتي', fr: 'Mes annonces' },
    nav_favorites:    { ar: 'المفضلة', fr: 'Favoris' },
    nav_messages:     { ar: 'الرسائل', fr: 'Messages' },
    nav_admin:        { ar: 'الإدارة', fr: 'Admin' },
    nav_login:        { ar: 'تسجيل الدخول', fr: 'Connexion' },
    nav_register:     { ar: 'حساب جديد', fr: 'Inscription' },
    nav_logout:       { ar: 'خروج', fr: 'Déconnexion' },
    nav_profile:      { ar: 'حسابي', fr: 'Mon profil' },
    hello:            { ar: 'مرحبا', fr: 'Bonjour' },
    search_ph:        { ar: 'شنو كتقلب عليه؟', fr: 'Que cherchez-vous ?' },
    see_all:          { ar: 'شوف الكل', fr: 'Tout voir' },
    back:             { ar: 'رجوع', fr: 'Retour' },
    back_home:        { ar: '↩ رجوع للرئيسية', fr: '↩ Retour à l\'accueil' },
    loading:          { ar: 'جاري التحميل…', fr: 'Chargement…' },
    error_generic:    { ar: 'وقع مشكل، عاود جرب', fr: 'Une erreur est survenue, réessayez' },
    csrf_invalid:     { ar: 'الجلسة انتهت — عافاك عاود حمل الصفحة', fr: 'Session expirée — rechargez la page' },
    db_error:         { ar: 'مشكل فقاعدة البيانات — تأكد أن MySQL خدام فـ XAMPP', fr: 'Erreur base de données — vérifiez que MySQL est démarré dans XAMPP' },
    server_error:     { ar: 'مشكل فالسيرفر', fr: 'Erreur serveur' },
    cancel:           { ar: 'إلغاء', fr: 'Annuler' },
    phone:            { ar: 'التيليفون', fr: 'Téléphone' },
    email:            { ar: 'الإيميل', fr: 'Email' },
    admin_badge:      { ar: 'أدمن', fr: 'Admin' },
    no_photo:         { ar: 'بلا صورة', fr: 'Sans photo' },
    mad:              { ar: 'د.م.', fr: 'MAD' },

    /* ===== Accueil ===== */
    hero_title:       { ar: 'بِيع و شري بلا تعقيد', fr: 'Vendez et achetez simplement' },
    hero_sub:         { ar: 'حط السلعة ديالك بالصورة و الثمن فأقل من دقيقة، تواصل مباشرة مع الفريخ، و ملي تباع — كناخدو غير 10% عمولة.', fr: 'Publiez votre article avec photo et prix en moins d\'une minute, discutez directement avec l\'acheteur. À la vente, la plateforme ne prend que 10% de commission.' },
    hero_badge_1:     { ar: 'النشر مجاني 100%', fr: 'Publication 100% gratuite' },
    hero_badge_2:     { ar: 'تواصل مباشر', fr: 'Contact direct' },
    hero_badge_3:     { ar: 'أمان و ثقة', fr: 'Sécurité & confiance' },
    categories_title: { ar: 'تسوق حسب التصنيف', fr: 'Parcourir par catégorie' },
    latest_title:     { ar: 'أحدث الإعلانات', fr: 'Dernières annonces' },
    results_title:    { ar: 'النتائج (:n)', fr: 'Résultats (:n)' },
    search_q:         { ar: 'نتائج البحث على : :q', fr: 'Résultats pour : :q' },
    no_results:       { ar: 'ما كاين حتى نتيجة', fr: 'Aucun résultat' },
    no_results_sub:   { ar: 'جرب تبدل الفلاتر ولا نشر إعلان جديد', fr: 'Essayez d\'ajuster vos filtres ou publiez une annonce' },
    all_categories:   { ar: 'كل التصنيفات', fr: 'Toutes catégories' },
    all_cities:       { ar: 'كل المدن', fr: 'Toutes les villes' },
    filter_city:      { ar: 'المدينة', fr: 'Ville' },
    filter_price_min: { ar: 'أقل ثمن', fr: 'Prix min' },
    filter_price_max: { ar: 'أقصى ثمن', fr: 'Prix max' },
    sort_by:          { ar: 'ترتيب', fr: 'Trier' },
    sort_newest:      { ar: 'الأحدث', fr: 'Plus récentes' },
    sort_price_asc:   { ar: 'الثمن : من الأرخص', fr: 'Prix croissant' },
    sort_price_desc:  { ar: 'الثمن : من الأغلى', fr: 'Prix décroissant' },
    apply:            { ar: 'بحث', fr: 'Rechercher' },
    reset:            { ar: 'إلغاء الفلاتر', fr: 'Réinitialiser' },
    prev:             { ar: 'السابق', fr: 'Précédent' },
    next:             { ar: 'التالي', fr: 'Suivant' },

    /* ===== Annonce ===== */
    listing_desc:     { ar: 'الوصف', fr: 'Description' },
    listing_by:       { ar: 'نشرها', fr: 'Publiée par' },
    published_on:     { ar: 'نُشرت', fr: 'Publiée' },
    contact_seller:   { ar: '💬 تواصل مع البائع', fr: '💬 Contacter le vendeur' },
    add_fav:          { ar: 'زيد للمفضلة', fr: 'Ajouter aux favoris' },
    sold_badge:       { ar: 'تباعت', fr: 'Vendu' },
    similar:          { ar: 'إعلانات مشابهة', fr: 'Annonces similaires' },
    seller_title:     { ar: 'معلومات البائع', fr: 'Le vendeur' },
    member_since:     { ar: 'عضو منذ', fr: 'Membre depuis' },
    view_profile:     { ar: 'شوف البروفيل', fr: 'Voir le profil' },
    own_listing:      { ar: 'هادي السلعة ديالك', fr: 'Ceci est votre annonce' },
    login_to_contact: { ar: 'سجل الدخول باش تواصل مع البائع', fr: 'Connectez-vous pour contacter le vendeur' },
    login_to_fav:     { ar: 'سجل الدخول باش تزيد للمفضلة', fr: 'Connectez-vous pour ajouter aux favoris' },
    safety_title:     { ar: 'نصيحة للأمان', fr: 'Conseil sécurité' },
    safety_text:      { ar: 'تلاقى مع البائع فبلاصة عامة، شوف السلعة بعينك قبل ما تخلص. ماتصيفطش حتى فلوس قبل ما تشوف السلعة.', fr: 'Rencontrez le vendeur dans un lieu public et vérifiez l\'article avant de payer. N\'envoyez jamais d\'argent sans avoir vu l\'article.' },
    category:         { ar: 'التصنيف', fr: 'Catégorie' },
    city:             { ar: 'المدينة', fr: 'Ville' },
    price:            { ar: 'الثمن', fr: 'Prix' },
    seller_net_note:  { ar: 'ملي تباع : البائع كيوصلو :x و المنصة كتاخد :y (10%)', fr: 'Après vente : le vendeur reçoit :x, la plateforme prend :y (10%)' },
    fav_added:        { ar: 'تزادت للمفضلة ♥', fr: 'Ajoutée aux favoris ♥' },
    fav_removed:      { ar: 'تحيّدات من المفضلة', fr: 'Retirée des favoris' },

    /* ===== Publier / Modifier ===== */
    create_title:     { ar: 'نشر إعلان جديد', fr: 'Publier une annonce' },
    edit_title:       { ar: 'تعديل الإعلان', fr: 'Modifier l\'annonce' },
    f_title:          { ar: 'عنوان السلعة', fr: 'Titre de l\'annonce' },
    f_title_ph:       { ar: 'مثال : آيفون 13 بحال جديد', fr: 'Ex : iPhone 13 comme neuf' },
    f_desc:           { ar: 'الوصف', fr: 'Description' },
    f_desc_ph:        { ar: 'الحالة ديال السلعة، الأكسسوارات، سباب البيع...', fr: 'État de l\'article, accessoires, raison de la vente...' },
    f_price:          { ar: 'الثمن (درهم)', fr: 'Prix (MAD)' },
    f_category:       { ar: 'التصنيف', fr: 'Catégorie' },
    f_city:           { ar: 'المدينة', fr: 'Ville' },
    f_image:          { ar: 'صورة السلعة', fr: 'Photo de l\'article' },
    f_image_hint:     { ar: 'JPG, PNG, WEBP — حتى 5 ميغا', fr: 'JPG, PNG, WEBP — 5 Mo max' },
    f_image_keep:     { ar: 'خليها فارغة باش تبقى الصورة القديمة', fr: 'Laissez vide pour garder l\'ancienne photo' },
    upload_drop:      { ar: '📷 كليكي هنا باش تختار صورة', fr: '📷 Cliquez ici pour choisir une photo' },
    btn_publish:      { ar: 'نشر الإعلان', fr: 'Publier l\'annonce' },
    btn_save:         { ar: 'سجل', fr: 'Enregistrer' },
    err_fill:         { ar: 'عافاك عمر العنوان و الثمن و التصنيف', fr: 'Merci de remplir le titre, le prix et la catégorie' },
    err_price:        { ar: 'الثمن خاصو يكون رقم أكبر من 0', fr: 'Le prix doit être un nombre supérieur à 0' },
    err_title_len:    { ar: 'العنوان خاصو 3 حروف على الأقل', fr: 'Le titre doit contenir au moins 3 caractères' },
    err_image_too_big:   { ar: 'الصورة كبيرة بزاف (5 ميغا كحد أقصى)', fr: 'Image trop lourde (5 Mo max)' },
    err_image_invalid:   { ar: 'هاد الملف ماشي صورة', fr: 'Ce fichier n\'est pas une image valide' },
    err_image_type:      { ar: 'نوع الصورة ماشي مدعوم (JPG, PNG, GIF, WEBP فقط)', fr: 'Format non supporté (JPG, PNG, GIF, WEBP uniquement)' },
    err_upload_failed:   { ar: 'وقع مشكل فتحميل الصورة، عاود جرب', fr: 'Erreur lors du téléversement, réessayez' },
    err_upload_error:    { ar: 'وقع مشكل فتحميل الصورة، عاود جرب', fr: 'Erreur lors du téléversement, réessayez' },
    created_ok:       { ar: 'الإعلان تنشر! مبروك 🎉', fr: 'Annonce publiée ! Bravo 🎉' },
    updated_ok:       { ar: 'تسجل التعديل', fr: 'Modifications enregistrées' },
    my_listings:      { ar: 'إعلاناتي', fr: 'Mes annonces' },
    ml_empty:         { ar: 'مازال ما نشرتي حتى إعلان — بدا دابا!', fr: 'Vous n\'avez encore rien publié — commencez maintenant !' },
    btn_edit:         { ar: '✏️ تعديل', fr: '✏️ Modifier' },
    btn_delete:       { ar: '🗑 حيّد', fr: '🗑 Supprimer' },
    btn_mark_sold:    { ar: '✔ علامها « تباعت »', fr: '✔ Marquer « vendue »' },
    confirm_sold:     { ar: 'واش متأكد؟ غادي تتسجل عمولة 10% للمنصة', fr: 'Confirmer ? La commission de 10% sera enregistrée' },
    confirm_delete:   { ar: 'واش متأكد بغيتي تحيّد هاد الإعلان؟', fr: 'Voulez-vous vraiment supprimer cette annonce ?' },
    marked_sold_ok:   { ar: 'مبروك! تباعت السلعة و العمولة (10%) تسجلت', fr: 'Bravo ! Vente enregistrée, commission (10%) ajoutée' },
    deleted_ok:       { ar: 'تحيّد الإعلان', fr: 'Annonce supprimée' },
    status_active:    { ar: 'نشطة', fr: 'Active' },
    status_sold:      { ar: 'تباعت', fr: 'Vendue' },
    net_for_you:      { ar: 'كيفصل ليك : :x', fr: 'Vous recevez : :x' },
    not_allowed:      { ar: 'ما عندكش الحق فهاكا', fr: 'Action non autorisée' },
    not_found:        { ar: 'ما لقيناش هاد الصفحة', fr: 'Page introuvable' },

    /* ===== Auth ===== */
    login_title:      { ar: 'تسجيل الدخول', fr: 'Connexion' },
    register_title:   { ar: 'حساب جديد', fr: 'Créer un compte' },
    f_name:           { ar: 'الاسم الكامل', fr: 'Nom complet' },
    f_email:          { ar: 'الإيميل', fr: 'Email' },
    f_password:       { ar: 'كلمة السر', fr: 'Mot de passe' },
    f_password2:      { ar: 'كرر كلمة السر', fr: 'Confirmer le mot de passe' },
    f_phone:          { ar: 'التيليفون (اختياري)', fr: 'Téléphone (optionnel)' },
    f_phone_ph:       { ar: '06 XX XX XX XX', fr: '06 XX XX XX XX' },
    f_city_ph:        { ar: 'مثال : كازا', fr: 'Ex : Casablanca' },
    btn_login:        { ar: 'دخل', fr: 'Se connecter' },
    btn_register:     { ar: 'سجل', fr: 'S\'inscrire' },
    no_account:       { ar: 'ما عندكش حساب؟', fr: 'Pas de compte ?' },
    have_account:     { ar: 'عندك حساب؟', fr: 'Déjà un compte ?' },
    err_email_format: { ar: 'الإيميل ماشي صحيح', fr: 'Email invalide' },
    err_email_taken:  { ar: 'هاد الإيميل مستعمل من قبل', fr: 'Cet email est déjà utilisé' },
    err_pass_len:     { ar: 'كلمة السر خاصها 6 حروف على الأقل', fr: 'Le mot de passe doit faire au moins 6 caractères' },
    err_pass_match:   { ar: 'كلمتي السر ماشي بحال بحال', fr: 'Les mots de passe ne correspondent pas' },
    err_name:         { ar: 'عافاك دخل اسمك', fr: 'Merci d\'indiquer votre nom' },
    err_credentials:  { ar: 'الإيميل ولا كلمة السر غالطين', fr: 'Email ou mot de passe incorrect' },
    change_password:    { ar: 'بدل كلمة السر', fr: 'Changer le mot de passe' },
    f_current_password: { ar: 'كلمة السر الحالية', fr: 'Mot de passe actuel' },
    f_new_password:     { ar: 'كلمة السر الجديدة', fr: 'Nouveau mot de passe' },
    f_new_password2:    { ar: 'كرر كلمة السر الجديدة', fr: 'Confirmer le nouveau mot de passe' },
    err_current_pass:   { ar: 'كلمة السر الحالية غالطة', fr: 'Mot de passe actuel incorrect' },
    err_pass_same:      { ar: 'كلمة السر الجديدة خاصها تكون مختلفة على القديمة', fr: 'Le nouveau mot de passe doit être différent de l\'ancien' },
    welcome_ok:       { ar: 'مرحبا بيك فـ Souk10!', fr: 'Bienvenue sur Souk10 !' },
    bye:              { ar: 'تشرفنا، تا لقاء!', fr: 'À bientôt !' },
    login_required:   { ar: 'خاصك تسجل الدخول الأول', fr: 'Veuillez vous connecter d\'abord' },
    admin_required:   { ar: 'هاد الصفحة للإدارة فقط', fr: 'Page réservée à l\'administration' },

    /* ===== Messagerie ===== */
    inbox:            { ar: 'الرسائل', fr: 'Messagerie' },
    inbox_empty:      { ar: 'ما عندكش حتى محادثة. من شي إعلان، ضغط على « تواصل مع البائع »', fr: 'Aucune conversation. Depuis une annonce, cliquez sur « Contacter le vendeur »' },
    msg_ph:           { ar: 'كتب الرسالة ديالك...', fr: 'Écrivez votre message...' },
    btn_send:         { ar: 'صيفط', fr: 'Envoyer' },
    about:            { ar: 'بخصوص', fr: 'À propos de' },
    you:              { ar: 'نتا', fr: 'Vous' },
    deleted_user:     { ar: 'مستخدم محيّد', fr: 'Compte supprimé' },
    conv_with:        { ar: 'محادثة مع', fr: 'Conversation avec' },
    empty_msg:        { ar: 'ماتقادرش تصيفط رسالة خاوية', fr: 'Message vide' },
    msg_too_long:     { ar: 'الرسالة طويلة بزاف (2000 حرف)', fr: 'Message trop long (2000 caractères)' },
    no_messages_yet:  { ar: 'مازال ما كاين حتى رسالة — بدا الحوار!', fr: 'Aucun message — démarrez la discussion !' },

    /* ===== Favoris ===== */
    fav_title:        { ar: 'المفضلة ديالي', fr: 'Mes favoris' },
    fav_empty:        { ar: 'مازال ما زدتي حتى سلعة للمفضلة', fr: 'Aucun favori pour le moment' },

    /* ===== Profil ===== */
    profile_of:       { ar: 'بروفيل', fr: 'Profil de' },
    listings_from:    { ar: 'إعلانات :n', fr: ':n annonces' },
    no_listings:      { ar: 'ما عندو حتى إعلان دابا', fr: 'Aucune annonce pour le moment' },

    /* ===== Admin ===== */
    admin_panel:      { ar: 'لوحة الإدارة', fr: 'Administration' },
    ad_dashboard:     { ar: 'لوحة القيادة', fr: 'Tableau de bord' },
    ad_listings:      { ar: 'الإعلانات', fr: 'Annonces' },
    ad_users:         { ar: 'المستخدمين', fr: 'Utilisateurs' },
    ad_commissions:   { ar: 'العمولات', fr: 'Commissions' },
    ad_messages:      { ar: 'المراسلات', fr: 'Messagerie' },
    back_site:        { ar: '↩ رجوع للموقع', fr: '↩ Retour au site' },
    st_users:         { ar: 'المستخدمون', fr: 'Utilisateurs' },
    st_listings:      { ar: 'الإعلانات', fr: 'Annonces' },
    st_active:        { ar: 'إعلانات نشطة', fr: 'Annonces actives' },
    st_sold:          { ar: 'سلع مبيوعة', fr: 'Ventes réalisées' },
    st_commission:    { ar: 'العمولات ديالك (10%)', fr: 'Vos commissions (10%)' },
    st_commission_m:  { ar: 'عمولات هاد الشهر', fr: 'Commissions ce mois-ci' },
    st_messages:      { ar: 'الرسائل', fr: 'Messages' },
    latest_sales:     { ar: 'آخر المبيعات', fr: 'Dernières ventes' },
    latest_users:     { ar: 'آخر المستخدمين', fr: 'Derniers inscrits' },
    latest_listings:  { ar: 'آخر الإعلانات', fr: 'Dernières annonces' },
    no_sales:         { ar: 'مازال ما كاين حتى بيعة — ملي تباع سلعة، العمولة كتسجل هنا أوتوماتيكيا', fr: 'Aucune vente pour le moment — dès qu\'une annonce passe « vendue », la commission s\'enregistre ici' },
    tbl_title:        { ar: 'السلعة', fr: 'Article' },
    tbl_seller:       { ar: 'البائع', fr: 'Vendeur' },
    tbl_buyer:        { ar: 'المشتري', fr: 'Acheteur' },
    tbl_price:        { ar: 'الثمن', fr: 'Prix' },
    tbl_commission:   { ar: 'العمولة (10%)', fr: 'Commission (10%)' },
    tbl_date:         { ar: 'التاريخ', fr: 'Date' },
    tbl_status:       { ar: 'الحالة', fr: 'Statut' },
    tbl_actions:      { ar: 'أوامر', fr: 'Actions' },
    tbl_user:         { ar: 'المستخدم', fr: 'Utilisateur' },
    tbl_count:        { ar: 'الإعلانات', fr: 'Annonces' },
    tbl_joined:       { ar: 'التسجيل', fr: 'Inscrit le' },
    tbl_category:     { ar: 'التصنيف', fr: 'Catégorie' },
    btn_view:         { ar: '👁 شوف', fr: '👁 Voir' },
    btn_sold:         { ar: '✔ علامها تباعت', fr: '✔ Marquer vendue' },
    btn_reopen:       { ar: '↩ رجعها نشطة', fr: '↩ Remettre en vente' },
    btn_make_admin:   { ar: 'خليه أدمن', fr: 'Rendre admin' },
    btn_remove_admin: { ar: 'حيّز الأدمن', fr: 'Retirer admin' },
    confirm_user_del: { ar: 'غادي تتحيّد كل معلومات هاد المستخدم (الإعلانات، المحادثات...). متأكد؟', fr: 'Toutes les données de cet utilisateur seront supprimées (annonces, conversations...). Continuer ?' },
    commission_note:  { ar: 'العمولة (10% من الثمن) كتسجل أوتوماتيكيا ملي كتشير السلعة « تباعت »', fr: 'La commission (10% du prix) est enregistrée automatiquement quand une annonce passe « vendue »' },
    total_all:        { ar: 'المجموع الإجمالي', fr: 'Total général' },
    sales_count:      { ar: 'عدد المبيعات', fr: 'Nombre de ventes' },
    avg_price:        { ar: 'متوسط ثمن البيع', fr: 'Prix moyen de vente' },
    view_convo:       { ar: '💬 شوف المحادثة', fr: '💬 Voir la conversation' },
    admin_readonly:   { ar: 'نتا أدمن — كتشوف هاد المحادثة بلا ما تشارك فيها', fr: 'Vous êtes admin — consultation en lecture seule' },
    filters_all:      { ar: 'الكل', fr: 'Tous' },
    filter_status:    { ar: 'الحالة', fr: 'Statut' },
    search:           { ar: '🔎 قلّب', fr: '🔎 Rechercher' },
    reopen_ok:        { ar: 'رجعات نشطة (عمولة محيّدة)', fr: 'Annonce remise en vente (commission annulée)' },
    sold_ok_admin:    { ar: 'تسجلت البيعة و العمولة', fr: 'Vente et commission enregistrées' },
    user_deleted:     { ar: 'تحيّد المستخدم', fr: 'Utilisateur supprimé' },
    err_cannot_admin: { ar: 'مايمكنش تبدل حساب الأدمن', fr: 'Impossible de modifier un compte admin' },
    admin_now:        { ar: 'ولى أدمن', fr: 'Est maintenant admin' },
    admin_removed:    { ar: 'تحيّدت صفة الأدمن', fr: 'Statut admin retiré' },

    /* ===== Divers ===== */
    footer_tag:       { ar: 'Souk10 — السوق المغربي أونلاين', fr: 'Souk10 — le marché marocain en ligne' },
    footer_rights:    { ar: 'جميع الحقوق محفوظة', fr: 'Tous droits réservés' },
    just_now:         { ar: 'دابا', fr: 'à l\'instant' },
    ago_min:          { ar: 'منذ :n دقيقة', fr: 'il y a :n min' },
    ago_hour:         { ar: 'منذ :n ساعة', fr: 'il y a :n h' },
    ago_day:          { ar: 'منذ :n يوم', fr: 'il y a :n j' },
    start_conv_error: { ar: 'ماقدرناش نفتحو المحادثة (الإعلان ماشي نشط ولا عندك)', fr: 'Impossible d\'ouvrir la conversation (annonce inactive ou à vous)' },
  },

  /* Villes marocaines (datalist) */
  cities: {
    ar: ['الدار البيضاء','الرباط','مراكش','فاس','طنجة','أكادير','مكناس','وجدة','تطوان','سلا','القنيطرة','آسفي','الجديدة','بني ملال','الناظور','العيون'],
    fr: ['Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir','Meknès','Oujda','Tétouan','Salé','Kénitra','Safi','El Jadida','Béni Mellal','Nador','Laâyoune'],
  },

  /** Traduire une clé avec paramètres : t('ago_min', {n: 5}) */
  t(key, params) {
    const entry = this.dict[key];
    let txt = entry ? entry[this.lang] || entry.fr || key : key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        txt = txt.replaceAll(':' + k, String(v));
      }
    }
    return txt;
  },

  /** Appliquer la langue aux éléments statiques de la page */
  apply(root = document) {
    const rtl = this.lang === 'ar';
    document.documentElement.lang = this.lang;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    $$('[data-i18n]', root).forEach(el => {
      el.textContent = this.t(el.dataset.i18n);
    });
    $$('[data-i18n-html]', root).forEach(el => {
      el.innerHTML = this.t(el.dataset.i18nHtml);
    });
    $$('[data-i18n-ph]', root).forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPh);
    });
    $$('[data-i18n-title]', root).forEach(el => {
      el.title = this.t(el.dataset.i18nTitle);
    });
  },

  /** Changer de langue (recharge la page pour tout re-rendre) */
  setLang(lang) {
    localStorage.setItem('souk10_lang', lang);
    location.reload();
  },
};

/** Raccourci global */
function t(key, params) { return I18N.t(key, params); }
