const auditData = {
  sectors: [
    {
      id: "exterior",
      name: "SECTOR EXTERIOR",
      maxScore: 9,
      items: [
        { id: "ext_1", points: 1, name: "Mesas", green: "Correcta higiene de las mismas tanto en su base como en superficie.", yellow: "Superficie limpia, base sucia.", red: "Sucias sin limpieza." },
        { id: "ext_2", points: 1, name: "Sillas", green: "Correcta higiene de las mismas tanto en su base como en superficie.", yellow: "Superficie limpia, base sucia.", red: "Sucias sin limpieza." },
        { id: "ext_3", points: 1.5, name: "Sombrillas", green: "Correcto armado de la misma y cantidad operativa.", yellow: "N/C", red: "Sucias sin limpieza." },
        { id: "ext_4", points: 2, name: "Vereda", green: "Veredas limpias, sin suciedad y baldosas sanas.", yellow: "Veredas limpias con pequeña suciedad.", red: "Veredas sucias hace varios días." },
        { id: "ext_5", points: 2, name: "Vidrios", green: "Sin marcas de manos, ni telarañas ni pegamento.", yellow: "Limpios pero con marcas de manos en puertas.", red: "Sucios con marcas de manos y telarañas y polvo." },
        { id: "ext_6", points: 1, name: "Puertas", green: "Sin marcas de manos y limpias a la luz natural.", yellow: "Limpias pero marcas de manos.", red: "Sucias con polvo y marcas de manos." },
        { id: "ext_7", points: 0.5, name: "Picaportes", green: "Limpios y desinfectados.", yellow: "Con marcas de uso leves.", red: "Sucios con marcas alrededor del mismo." }
      ]
    },
    {
      id: "interior",
      name: "SECTOR INTERIOR",
      maxScore: 15,
      items: [
        { id: "int_1", points: 4, name: "Mesas", green: "Correcta higiene de las mismas tanto en su base como en superficie.", yellow: "Superficie limpia, base sucia.", red: "Sucias sin limpieza." },
        { id: "int_2", points: 4, name: "Sillas", green: "Correcta higiene de las mismas tanto en su base como en superficie.", yellow: "Superficie limpia, base sucia.", red: "Sucias sin limpieza." },
        { id: "int_3", points: 2, name: "Paredes", green: "Correcta higiene de las mismas sin manchas ni restos de comida.", yellow: "N/C", red: "Manchas en paredes de polvo, roce de manos y/o comida." },
        { id: "int_4", points: 2.5, name: "Telarañas", green: "Ausencia de telarañas en techos del sector.", yellow: "N/C", red: "Telarañas en el sector techo." },
        { id: "int_5", points: 2.5, name: "Luces colgantes", green: "Correcta higiene sin telarañas en su boca ni polvillo en su superficie.", yellow: "Pequeños rastros de telarañas mínimos.", red: "Sucias y con telarañas." }
      ]
    },
    {
      id: "banos_hombres",
      name: "BAÑOS HOMBRES",
      maxScore: 8,
      items: [
        { id: "bh_1", points: 2.5, name: "Higiene general", green: "Higiene de pisos, espejos y paredes óptimas.", yellow: "Detalles de higiene no contemplado pero no graves.", red: "Pisos sucios y restos de orina, espejos sucios etc." },
        { id: "bh_2", points: 2, name: "¿Cuenta con papel?", green: "Buena cantidad de papel higiénico.", yellow: "N/C", red: "NO" },
        { id: "bh_3", points: 1, name: "¿Cuenta con toalla de manos?", green: "Dispone del insumo en cantidad necesaria.", yellow: "N/C", red: "NO" },
        { id: "bh_4", points: 1.5, name: "¿Cuenta con bolsa de residuos?", green: "Dispone del insumo en cantidad necesaria.", yellow: "N/C", red: "NO" },
        { id: "bh_5", points: 1, name: "Higiene de espejos", green: "Los espejos están limpios y sin marcas del uso ni manchas de agua.", yellow: "N/C", red: "Espejos sucios y con marcas de salpicaduras de agua." }
      ]
    },
    {
      id: "banos_mujeres",
      name: "BAÑO MUJERES",
      maxScore: 8,
      items: [
        { id: "bm_1", points: 2.5, name: "Higiene general", green: "Higiene de pisos, espejos y paredes óptimas.", yellow: "Detalles de higiene no contemplado pero no graves.", red: "Pisos sucios y restos de orina, espejos sucios etc." },
        { id: "bm_2", points: 2, name: "¿Cuenta con papel?", green: "Buena cantidad de papel higiénico.", yellow: "N/C", red: "NO" },
        { id: "bm_3", points: 1, name: "¿Cuenta con toalla de manos?", green: "Dispone del insumo en cantidad necesaria.", yellow: "N/C", red: "NO" },
        { id: "bm_4", points: 1.5, name: "¿Cuenta con bolsa de residuos?", green: "Dispone del insumo en cantidad necesaria.", yellow: "N/C", red: "NO" },
        { id: "bm_5", points: 1, name: "Higiene de espejos", green: "Los espejos están limpios y sin marcas del uso ni manchas de agua.", yellow: "N/C", red: "Espejos sucios y con marcas de salpicaduras de agua." }
      ]
    },
    {
      id: "mostrador",
      name: "SECTOR MOSTRADOR",
      maxScore: 20,
      items: [
        { id: "mos_1", points: 2, name: "Higiene heladera exhibidora", green: "Burletes en perfecto estado y puertas limpias.", yellow: "N/C", red: "Sucias." },
        { id: "mos_2", points: 4, name: "Reposición de bebidas", green: "Al menos 12 productos de cada uno listos para venta.", yellow: "Menos de 12 pero más de 6.", red: "Menos de 6 productos de 1 bebida disponible en stock." },
        { id: "mos_3", points: 2, name: "Barra", green: "En perfectas condiciones de higiene.", yellow: "Con elementos ajenos al sector.", red: "Marcas de suciedad por polvo." },
        { id: "mos_4", points: 2, name: "Cámara cervecera", green: "En perfecto estado de higiene sin cerveza derramada y vasos limpios sin cajas.", yellow: "Con cerveza derramada y vasos sucios.", red: "Sucia." },
        { id: "mos_5", points: 5, name: "Freidoras", green: "En perfecto estado de higiene y aceite en buen estado.", yellow: "N/C", red: "Sin rastros de limpieza profunda y aceite oscuro." },
        { id: "mos_6", points: 2, name: "Vasos de vidrio", green: "En perfecto orden e higiene con las letras apuntando al público.", yellow: "Vasos mal acomodados pero limpios.", red: "Vasos sucios y mal acomodados." },
        { id: "mos_7", points: 3, name: "Piso", green: "Limpio y sin grasa visible.", yellow: "Pisos limpios (pero con algún detalle menor).", red: "Pisos sucios con detalles de grasa y restos de comida o aceite." }
      ]
    },
    {
      id: "cocina",
      name: "SECTOR COCINA",
      maxScore: 25,
      items: [
        { id: "coc_1", points: 3, name: "Sector bacha", green: "Ordenado en el sector bajo y en perfectas condiciones de higiene.", yellow: "Sector con muy buena higiene, un poco de desorden.", red: "Sector desordenado y sucio." },
        { id: "coc_2", points: 4, name: "Campana", green: "En perfecto estado de higiene y en óptimo funcionamiento.", yellow: "Buena higiene pero sin limpieza operacional.", red: "Sin rastros de limpieza profunda durante varios días." },
        { id: "coc_3", points: 4, name: "Plancha", green: "Perfecto estado de higiene y buen uso operativo.", yellow: "Buena higiene aunque mantenimiento regular.", red: "Sin rastros de limpieza profunda durante varios días." },
        { id: "coc_4", points: 3, name: "Pisos", green: "Limpio y sin grasa visible.", yellow: "Pisos limpios.", red: "Pisos sucios con detalles de grasa y restos de comida o aceite." },
        { id: "coc_5", points: 1.5, name: "Cestos de basura", green: "En buen estado de higiene y no rebalzado de residuos.", yellow: "N/C", red: "Colapsado y con manchas de higiene." },
        { id: "coc_6", points: 2, name: "Freezers", green: "Despejados y sin cajas de otros sectores o productos, sin acumulación de hielo.", yellow: "N/C", red: "Mucho hielo, productos atisbados arriba del mismo." },
        { id: "coc_7", points: 2.5, name: "Heladeras exhibidoras", green: "Burletes en perfecto estado y puertas limpias.", yellow: "N/C", red: "Sucias." },
        { id: "coc_8", points: 5, name: "Producción", green: "No faltan ningun producto (toppings preparados).", yellow: "Falta 1 producto.", red: "Faltan 2 o más productos de la producción." }
      ]
    },
    {
      id: "personal",
      name: "PERSONAL",
      maxScore: 15,
      items: [
        { id: "per_1", points: 5, name: "Uniforme completo", green: "Personal con el uniforme completo y en buen estado en relación a su área.", yellow: "No posee pantalón según manual.", red: "Personal sin gorra, sin cofia, con aritos, uñas etc." },
        { id: "per_2", points: 0, name: "¿Poseen libretas sanitarias?", green: "SI", yellow: "N/C", red: "NO" },
        { id: "per_3", points: 10, name: "BPMA", green: "Personal sin piercings, uñas, aritos o cualquier elemento que pueda afectar la higiene.", yellow: "N/C", red: "Personal con alguno de los elementos prohibidos." }
      ]
    }
  ]
};
