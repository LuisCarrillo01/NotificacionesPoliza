export const PREDEFINED_PLANS = [
  {
    id: 'plan_individual_basico',
    name: 'Plan Individual Básico',
    type: 'individual',
    coverages: [
      {
        coverageType: 'emergencia',
        maximumAmount: 800.00,
        coveragePercentage: 70,
        description: 'Cobertura basica para emergencias',
        appliesToEmergency: true
      },
      {
        coverageType: 'medicamentos',
        maximumAmount: 200.00,
        coveragePercentage: 60,
        description: 'Medicamentos recetados',
        appliesToEmergency: true
      },
      {
        coverageType: 'otros',
        maximumAmount: 150.00,
        coveragePercentage: 50,
        description: 'Consultas y otros',
        appliesToEmergency: false
      }
    ]
  },
  {
    id: 'plan_individual_plus',
    name: 'Plan Individual Plus',
    type: 'individual',
    coverages: [
      {
        coverageType: 'emergencia',
        maximumAmount: 2000.00,
        coveragePercentage: 85,
        description: 'Cobertura extendida para emergencias',
        appliesToEmergency: true
      },
      {
        coverageType: 'internamiento',
        maximumAmount: 1500.00,
        coveragePercentage: 80,
        description: 'Gastos de hospitalizacion',
        appliesToEmergency: true
      },
      {
        coverageType: 'medicamentos',
        maximumAmount: 500.00,
        coveragePercentage: 75,
        description: 'Medicamentos y suministros',
        appliesToEmergency: true
      },
      {
        coverageType: 'cirugia',
        maximumAmount: 2500.00,
        coveragePercentage: 70,
        description: 'Procedimientos quirurgicos',
        appliesToEmergency: true
      }
    ]
  }
];
