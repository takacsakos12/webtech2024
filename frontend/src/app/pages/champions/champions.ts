import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-champions',
  imports: [FormsModule],
  templateUrl: './champions.html',
  styleUrl: './champions.css',
})
export class Champions {
  champions = [
    {
      id: 1,
      name: 'Joshua Van',
      weightClass: 'Légsúly',
      organization: 'UFC',
    },
    {
      id: 2,
      name: 'Petr Yan',
      weightClass: 'Harmatsúly',
      organization: 'UFC',
    },
    {
      id: 3,
      name: 'Alexander Volkanovski',
      weightClass: 'Pehelysúly',
      organization: 'UFC',
    },
    {
      id: 4,
      name: 'Justin Gaethje',
      weightClass: 'Könnyűsúly',
      organization: 'UFC',
    },
    {
      id: 5,
      name: 'Islam Makhachev',
      weightClass: 'Váltósúly',
      organization: 'UFC',
    },
    {
      id: 6,
      name: 'Sean Strickland',
      weightClass: 'Középsúly',
      organization: 'UFC',
    },
    {
      id: 7,
      name: 'Carlos Ulberg',
      weightClass: 'Félnehézsúly',
      organization: 'UFC',
    },
    {
      id: 8,
      name: 'Ciryl Gane',
      weightClass: 'Nehézsúly',
      organization: 'UFC',
    },
  ];

  lastChecked = '2026. november 2.';
  search = '';
  get filteredChampions() {
    const query = this.search.trim().toLocaleLowerCase('hu');

    return this.champions.filter((champion) => {
      return champion.name.toLocaleLowerCase('hu').includes(query) || champion.weightClass.toLocaleLowerCase('hu').includes(query) || champion.organization.toLocaleLowerCase('hu').includes(query);
    });
  }
}
