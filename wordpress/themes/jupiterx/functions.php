<?php
/**
 * Jupiter X Framework.
 * This core file should only be overwritten via your child theme.
 *
 * We strongly recommend to read the Jupiter documentation to find out more about
 * how to customize the Jupiter theme.
 *
 * @author JupiterX
 * @link   https://artbees.net
 * @package JupiterX\Framework
 */

/**
 * Initialize Jupiter theme framework.
 *
 * @author JupiterX
 * @link   https://artbees.net
 */
require_once dirname( __FILE__ ) . '/lib/init.php';

/**
 * Initialize BDA Portal API
 *
 * Loads all API components (CORS, Controllers, Routes)
 */
require_once dirname( __FILE__ ) . '/inc/api/api-init.php';

/**
 * Initialize BDA Portal API v2 (additional endpoints)
 */
require_once dirname( __FILE__ ) . '/inc/bda-portal-api/init.php';
