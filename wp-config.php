<?php














/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'u746595765_B5B52' );

/** Database username */
define( 'DB_USER', 'u746595765_mHnzf' );

/** Database password */
define( 'DB_PASSWORD', 'VxIzO3rDTk' );

/** Database hostname */
define( 'DB_HOST', '127.0.0.1' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          'T:?:IikO,*OURaQY!`|L)-1#5?PMI%<32T6S/2JS>|m7U-S6WYEo1J{Xseeg!LRS' );
define( 'SECURE_AUTH_KEY',   'ap8W8rol<wo)o }Af3.[g? z@lFfVebG$?R[+98@RItYjN4J8+M)/$ lDGgE@-u{' );
define( 'LOGGED_IN_KEY',     '[y@na7y}AIIHqW|IHdOzhiQoH[-3KdH3fiUnG:Vk^7xqM2=]xHlr{sV%XRSXXq24' );
define( 'NONCE_KEY',         'rFiFCJ|TO+VwryA(9m`1kj4Nnv~_!Jzgk9SJxm)*x?@t7ieK9!s`Xm)#9m~%UgD`' );
define( 'AUTH_SALT',         '8x@PQn9HhBHi{cj{f.y; &5 yTbQ>`D@Ys7b!QSk<__,Vu@3 [<BDuEM=_I(hoC[' );
define( 'SECURE_AUTH_SALT',  '>8.z{BL?8G{>aSF,lDRjaN9_g.CL#n7Ra!oO;tysR;n{ pc+*gNfbr5:Pa3sz%dP' );
define( 'LOGGED_IN_SALT',    '022vqiJCz~srcXV=w3HG:NHBY/K@CI`#oh7DM.&G5$kDET#H|=[%GB-%{/T>~;zV' );
define( 'NONCE_SALT',        'UX.<R)K$#*:{J nLfvM[N?Ud<Rm}AEPcwVtxEm-jU7Y,tRkfH>)Qp[!w]xG=,?$u' );
define( 'WP_CACHE_KEY_SALT', 'w:-p5sEq>Ac%+0Svm!*!6Z)%zJ^/YP(^Zh+)~$?T@ 3_e7hrw`67mt< `5saVT5+' );


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';


/* Add any custom values between this line and the "stop editing" line. */

// JWT Authentication Configuration for BDA Portal
define('JWT_AUTH_SECRET_KEY', 'bda-portal-jwt-super-secret-key-2024-make-this-very-long-random-string-for-maximum-security-xK7mN9pQ2wE5tY8uI1oP3aS6dF4gH7jL');
define('JWT_AUTH_CORS_ENABLE', true);

// JWT Token expiration (24 hours for security)
define('JWT_AUTH_EXPIRE', 24 * HOUR_IN_SECONDS);



/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', false );
}

define( 'FS_METHOD', 'direct' );
define( 'COOKIEHASH', '12b336c56d9b74ae10371afcdb2b7cd6' );
define( 'WP_AUTO_UPDATE_CORE', false );
/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';