// ==============================================================================
// OceanSense — Zone & Gateway Controller
// ==============================================================================

import { Request, Response } from 'express';

const OCEAN_ZONES = [
  {
    id: 'ZONE-A',
    name: 'Abyssal Trench Alpha',
    description: 'Deep benthic canyon with complex acoustic propagation and thermal vents',
    min_latitude: 10.200000,
    max_latitude: 10.245000,
    min_longitude: 80.100000,
    max_longitude: 80.145000,
    depth_min_m: 250.00,
    depth_max_m: 390.00,
    status: 'ACTIVE',
    target_species: 'Atlantic Bluefin Tuna',
    node_count: 250,
  },
  {
    id: 'ZONE-B',
    name: 'Pelagic Ridge Bravo',
    description: 'Mid-depth submarine ridge with persistent sub-surface currents',
    min_latitude: 10.245000,
    max_latitude: 10.290000,
    min_longitude: 80.100000,
    max_longitude: 80.145000,
    depth_min_m: 150.00,
    depth_max_m: 275.00,
    status: 'ACTIVE',
    target_species: 'Atlantic Mackerel',
    node_count: 250,
  },
  {
    id: 'ZONE-C',
    name: 'Benthic Shelf Charlie',
    description: 'Gradual continental shelf slope optimal for groundfish and pelagic schools',
    min_latitude: 10.200000,
    max_latitude: 10.245000,
    min_longitude: 80.145000,
    max_longitude: 80.190000,
    depth_min_m: 90.00,
    depth_max_m: 195.00,
    status: 'ACTIVE',
    target_species: 'Pacific Sardine',
    node_count: 250,
  },
  {
    id: 'ZONE-D',
    name: 'Sanctuary Transition Delta',
    description: 'Ecological marine sanctuary perimeter under restricted surveillance',
    min_latitude: 10.245000,
    max_latitude: 10.290000,
    min_longitude: 80.145000,
    max_longitude: 80.190000,
    depth_min_m: 45.00,
    depth_max_m: 130.00,
    status: 'ACTIVE',
    target_species: 'Yellowfin Tuna',
    node_count: 250,
  },
];

const GATEWAYS = [
  {
    id: 'GW-001',
    name: 'North-West Primary Buoy',
    latitude: 10.222500,
    longitude: 80.122500,
    cable_status: 'NOMINAL',
    power_status: 'SOLAR_ACTIVE',
    communication_status: 'ONLINE',
    health_score: 99.20,
    connected_nodes: 250,
  },
  {
    id: 'GW-002',
    name: 'North-East Primary Buoy',
    latitude: 10.267500,
    longitude: 80.122500,
    cable_status: 'NOMINAL',
    power_status: 'SOLAR_ACTIVE',
    communication_status: 'ONLINE',
    health_score: 98.70,
    connected_nodes: 250,
  },
  {
    id: 'GW-003',
    name: 'South-West Secondary Buoy',
    latitude: 10.222500,
    longitude: 80.167500,
    cable_status: 'NOMINAL',
    power_status: 'SOLAR_ACTIVE',
    communication_status: 'ONLINE',
    health_score: 97.40,
    connected_nodes: 250,
  },
  {
    id: 'GW-004',
    name: 'South-East Cabled Hub',
    latitude: 10.267500,
    longitude: 80.167500,
    cable_status: 'NOMINAL',
    power_status: 'SOLAR_ACTIVE',
    communication_status: 'ONLINE',
    health_score: 100.00,
    connected_nodes: 250,
  },
];

export class ZoneController {
  getZones(req: Request, res: Response) {
    return res.json({
      success: true,
      data: OCEAN_ZONES,
    });
  }

  getGateways(req: Request, res: Response) {
    return res.json({
      success: true,
      data: GATEWAYS,
    });
  }
}

export const zoneController = new ZoneController();
