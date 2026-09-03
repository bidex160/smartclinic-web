import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {  NetworkPulseComponent } from "./components/network-pulse/network-pulse.component";
import {  JoinPortalComponent } from "./components/join-portal/join-portal.component";
import {  CommunityLeaderboardComponent } from "./components/community-leaderboard/community-leaderboard.component";

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    JoinPortalComponent,
    NetworkPulseComponent,
    CommunityLeaderboardComponent,
],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss'],
})
export class JoinComponent {}
