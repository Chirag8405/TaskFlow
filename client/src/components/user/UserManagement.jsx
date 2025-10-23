import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Building, 
  UserPlus, 
  Settings, 
  MoreVertical,
  Crown,
  Mail,
  Clock,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const UserManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [organizations, setOrganizations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        orgsResponse,
        teamsResponse,
        rolesResponse,
        invitationsResponse
      ] = await Promise.all([
        api.get('/user-management/organizations'),
        api.get('/user-management/teams'),
        api.get('/user-management/roles'),
        api.get('/user-management/invitations/pending')
      ]);

      setOrganizations(orgsResponse.data.data);
      setTeams(teamsResponse.data.data);
      setRoles(rolesResponse.data.data);
      setPendingInvitations(invitationsResponse.data.data);
    } catch (error) {
      console.error('Error fetching user management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (token) => {
    try {
      await api.post(`/user-management/invitations/${token}/accept`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleDeclineInvitation = async (token) => {
    try {
      await api.post(`/user-management/invitations/${token}/decline`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Organizations</p>
              <p className="text-2xl font-semibold text-gray-900">
                {organizations.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Teams</p>
              <p className="text-2xl font-semibold text-gray-900">
                {teams.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Roles</p>
              <p className="text-2xl font-semibold text-gray-900">
                {roles.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Mail className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Invites</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pendingInvitations.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Pending Invitations
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingInvitations.map((invitation) => (
              <div key={invitation._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {invitation.organization && (
                        <Building className="h-6 w-6 text-blue-600" />
                      )}
                      {invitation.team && (
                        <Users className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {invitation.organization?.name || invitation.team?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Invited by {invitation.invitedBy.name} as {invitation.role.name}
                      </p>
                      {invitation.message && (
                        <p className="text-sm text-gray-600 mt-1">
                          "{invitation.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleAcceptInvitation(invitation.token)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineInvitation(invitation.token)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Organizations */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Your Organizations
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {organizations.slice(0, 5).map((org) => (
            <div key={org._id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {org.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {org.activeMemberCount} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {org.owner._id === user._id && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const OrganizationsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Organizations</h3>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Create Organization
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {organizations
            .filter(org => 
              org.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((org) => (
              <div key={org._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {org.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {org.description || 'No description'}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          {org.activeMemberCount} members
                        </span>
                        <span className="text-sm text-gray-500">
                          Owner: {org.owner.name}
                        </span>
                        {org.domain && (
                          <span className="text-sm text-gray-500">
                            Domain: {org.domain}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {org.owner._id === user._id && (
                      <Crown className="h-5 w-5 text-yellow-500" />
                    )}
                    <button
                      onClick={() => setSelectedOrg(org)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const TeamsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Teams</h3>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
          <Users className="h-4 w-4 mr-2" />
          Create Team
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="divide-y divide-gray-200">
          {teams.map((team) => (
            <div key={team._id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {team.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {team.description || 'No description'}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-500">
                        {team.memberCount} members
                      </span>
                      <span className="text-sm text-gray-500">
                        Lead: {team.lead.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        Organization: {team.organization.name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {team.lead._id === user._id && (
                    <Crown className="h-5 w-5 text-yellow-500" />
                  )}
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const RolesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Roles & Permissions</h3>
        {user.role === 'admin' && (
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
            <Shield className="h-4 w-4 mr-2" />
            Create Role
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="divide-y divide-gray-200">
          {roles.map((role) => (
            <div key={role._id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div 
                      className="h-12 w-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${role.color}20` }}
                    >
                      <Shield 
                        className="h-6 w-6" 
                        style={{ color: role.color }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {role.name}
                      </h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Level {role.level}
                      </span>
                      {role.isSystemRole && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          System
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {role.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {role.permissions.map((permission, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {permission.resource}: {permission.actions.join(', ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {!role.isSystemRole && user.role === 'admin' && (
                  <div className="flex space-x-2">
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Edit
                    </button>
                    <button className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Users },
    { id: 'organizations', name: 'Organizations', icon: Building },
    { id: 'teams', name: 'Teams', icon: Users },
    { id: 'roles', name: 'Roles', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">
          Manage organizations, teams, roles, and permissions
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'organizations' && <OrganizationsTab />}
        {activeTab === 'teams' && <TeamsTab />}
        {activeTab === 'roles' && <RolesTab />}
      </div>
    </div>
  );
};

export default UserManagement;